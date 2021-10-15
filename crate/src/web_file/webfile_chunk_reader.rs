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
        let reader = WebFileReader::new_from_file(start, self.length as i32);
        Ok(reader)
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        self.length
    }
}