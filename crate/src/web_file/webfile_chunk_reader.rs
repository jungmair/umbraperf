

use crate::utils::print_to_cons::print_to_js_with_obj;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;
use parquet::errors::ParquetError;

use super::cachereader::CacheReader;


pub struct WebFileChunkReader {
    length: u64,
    buffer: CacheReader
}

impl WebFileChunkReader {
    pub fn new(file_size: i32) -> Self {
        Self {
            length: file_size as u64,
            buffer: CacheReader::init_reader(0, file_size)
        }
    }
}

impl ChunkReader for WebFileChunkReader {
    type T = CacheReader;

    fn get_read(&self, start: u64, length: usize) -> Result<CacheReader> {
        if start + length as u64 > self.length {
            return Err(ParquetError::EOF("End of file".to_string()));
        }

        print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?} {:?}", "new_get_read()", "start", start, "length", length).into());

        let buf_read = self.buffer.request_reader(start, length);
        Ok(buf_read)
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        self.length
    }
}