use std::io::{Read};
use std::io::Result;

use super::webfile_chunk_reader::Entry;
use super::webfile_reader::WebFileReader;


pub struct CacheReader {
    offset: usize,
    read_size: usize,
    buffer: Option<Entry>,
}

impl CacheReader {

    pub fn init_reader_with_buffer(offset: usize, read_size: usize, file_size: i32, buffer: Vec<u8>) -> Self {
        Self {
            offset,
            read_size: read_size,
            buffer: Some(Entry{file_offset: offset, buffer: buffer})
        }
    }

}

impl Read for CacheReader {

    fn read(&mut self, out: &mut [u8]) -> Result<usize> {

        if let Some(entry) = self.buffer {

            //out.clone_from_slice(entry.buffer[ self.re.. out.len()])
            self.offset = self.offset + result.unwrap();

        } else {

            return Ok(0);

        }

        


    
    }
}