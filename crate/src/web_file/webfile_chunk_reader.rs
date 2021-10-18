

use std::cell::RefCell;

use crate::utils::print_to_cons::print_to_js_with_obj;
use crate::web_file::cache_reader::CacheReader;
use crate::web_file::webfile_reader::WebFileReader;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;
use parquet::errors::ParquetError;

use super::cache_reader::Entry;


pub struct State {
    pub buffer: Option<Entry>,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State {
        buffer: None
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

fn get_cache() -> Option<Entry> {
    with_state(|s| s.buffer.clone())
}

fn set_cache(entry: Entry) {
    _with_state_mut(|s| s.buffer = Some(entry));
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
        if start + length as u64 > self.file_size {
            return Err(ParquetError::EOF("End of file".to_string()));
        }

        print_to_js_with_obj(&format!("{:?} {:?} {:?}", "get_read()", start, length).into());


        // if not much is read we need to preread
        if length < 8 * 1024 {
            if let Some(entry) = get_cache() {
                if start >= entry.file_offset && (start as usize + length) <= (entry.buffer.len() + entry.file_offset as usize) {
                    print_to_js_with_obj(&format!("{:?} {:?} {:?}", "already read get out of buffer()", start, length).into());

                    let buf_read = CacheReader::init_reader(start, length, vec![get_cache().unwrap()]);
                    return Ok(buf_read);
                } 
            }
            let mut out_buf = vec![0; 1024*8];
            let mut webfile_reader = WebFileReader::init_reader(start);
            webfile_reader.read_from_js(&mut out_buf);
            set_cache(Entry{file_offset: start, buffer: out_buf});
            let buf_read = CacheReader::init_reader(start, length, vec![get_cache().unwrap()]);
            return Ok(buf_read);
        } else {
            print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?} {:?}", "new_get_read()", "start", start, "length", length).into());
            let buf_read = CacheReader::init_reader(start, length, Vec::new());
            Ok(buf_read)
        }

    }
}

impl Length for WebFileChunkReader {

    fn len(&self) -> u64 {
        print_to_js_with_obj(&format!("{:?}", "length?").into());

        self.file_size
    }
}