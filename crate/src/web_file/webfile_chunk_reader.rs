

use std::cell::RefCell;
use crate::web_file::cache_reader::CacheReader;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;
use parquet::errors::ParquetError;

use super::webfile_reader::WebFileReader;

#[derive(Debug, Clone)]
pub struct Entry {
    file_offset: usize,
    buffer: Vec<u8>
}

pub struct State {
    pub buffer: Vec<Entry>,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State {
        buffer: Vec::new()
    });
}

// STATE ACCESS
fn with_state<Callback, ReturnType>(cb: Callback) -> ReturnType
where
    Callback: FnOnce(&State) -> ReturnType,
{
    STATE.with(|s| cb(&s.borrow()))
}

fn _with_state_mut<Callback, ReturnType>(cb: Callback) -> ReturnType
where
    Callback: FnOnce(&mut State) -> ReturnType,
{
    STATE.with(|s| cb(&mut s.borrow_mut()))
}

fn get_cache() -> Vec<Entry> {
    with_state(|s| s.buffer.clone())
}

fn set_cache(entry: Entry) {
    _with_state_mut(|s| s.buffer.push(entry));
}


pub struct WebFileChunkReader {
    file_size: u64
}

impl WebFileChunkReader {
    pub fn new(file_size: i32) -> Self {
        Self {
            file_size: file_size as u64,
        }
    }
}

impl ChunkReader for WebFileChunkReader {
    type T = CacheReader;

    fn get_read(&self, start: u64, length: usize) -> Result<Self::T> {

        let start = start as usize;
        let cache = get_cache();

        for entry in cache {

            if start > entry.file_offset && start + length <= entry.file_offset + entry.buffer.len() {

                let reader = CacheReader::init_reader_with_buffer(start, length, self.file_size as i32, entry.buffer);
                return Ok(reader);

            }

        }

        let standard_read_size = 8 * 1024;
        let mut buf = vec![0,standard_read_size];
        let wf_reader = WebFileReader::init_reader(start);
        let wf_result = wf_reader.read_from_js(&buf);
        set_cache(Entry{file_offset: start, buffer: buf});

        return self.get_read(&self, start, length);

    }
}

impl Length for WebFileChunkReader {

    fn len(&self) -> u64 {
        self.file_size
    }
}