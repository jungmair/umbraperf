use std::io::BufRead;
use std::io::BufReader;
use std::io::Read;

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
        if start + length as u64 > self.length {
            return Err(ParquetError::EOF("End of file".to_string()));
        }

        //print_to_js_with_obj(&format!("In Chunk Reader").into());

        //  print_to_js_with_obj(&format!("start:{:?} length:{:?}", start, length ).into());


        let mut buf_read = WebFileReader::new_from_file(start,start, start as i32 + length as i32);
        let mut buf = vec![0; length];
        buf_read.read_into_buffer(&mut buf);
        Ok(buf_read)
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        self.length
    }
}