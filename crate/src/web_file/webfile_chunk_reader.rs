use std::io::BufRead;
use std::io::BufReader;
use std::io::Read;

use crate::get_webfile_reader;
use crate::set_webfile_reader;
use crate::utils::print_to_cons::print_to_js_with_obj;
use crate::web_file::streambuf::WebFileReader;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;
use parquet::errors::ParquetError;

pub struct WebFileChunkReader {
    length: u64
}

impl WebFileChunkReader {
    pub fn new(file_size: i32) -> Self {

        Self {
            length: file_size as u64
        }
    }
}

impl ChunkReader for WebFileChunkReader {
    type T = WebFileReader;

    fn get_read(&self, start: u64, length: usize) -> Result<WebFileReader> {

        let mut reader = get_webfile_reader();

        if reader.offset < start && reader.offset as usize + reader.buffer.len() >= start as usize + length {
            reader.set_offset(start, start);
            return Ok(reader)
        } else {
            let mut reader = WebFileReader::new_from_file(start,start, self.length as i32);
 
            let mut buf = vec![0; (64 * 1024).max(length)];
            reader.read_into_buffer(&mut buf);
    
            set_webfile_reader(reader);
    
            let mut reader = get_webfile_reader();
            reader.set_offset(start, start);
            Ok(reader)

        }
      
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        self.length
    }
}
