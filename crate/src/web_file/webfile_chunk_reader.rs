

use crate::utils::print_to_cons::print_to_js_with_obj;
use crate::web_file::cache_reader::CacheReader;
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
            length: file_size as u64,
        }
    }
}

impl ChunkReader for WebFileChunkReader {
    type T = CacheReader;

    fn get_read(&self, start: u64, length: usize) -> Result<Self::T> {
        if start + length as u64 > self.length {
            return Err(ParquetError::EOF("End of file".to_string()));
        }
        print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?} {:?}", "new_get_read()", "start", start, "length", length).into());
        let buf_read = CacheReader::init_reader(start, length, self.length as i32);
        Ok(buf_read)
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        self.length
    }
}