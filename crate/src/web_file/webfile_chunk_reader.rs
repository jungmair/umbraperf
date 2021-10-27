use std::io::BufRead;
use std::io::BufReader;

use crate::web_file::streambuf::WebFileReader;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;
use parquet::errors::ParquetError;

use super::complete_file;
use super::complete_file::CompleteFile;


pub struct WebFileChunkReader {
    length: u64
}

impl WebFileChunkReader {
    pub fn new(file_size: i32) -> Self {
        let buf_read = CompleteFile::read_whole_file(file_size as u64);
        Self {
            length: file_size as u64
        }
    }
}

impl ChunkReader for WebFileChunkReader {
    type T = CompleteFile;

    fn get_read(&self, start: u64, length: usize) -> Result<CompleteFile> {
        if start + length as u64 > self.length {
            return Err(ParquetError::EOF("End of file".to_string()));
        }

        //let complete_file = CompleteFile::read_whole_file(self.length as u64);
        let buf_read = CompleteFile::set_offset(start);
        Ok(buf_read)
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        self.length
    }
}