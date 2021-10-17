

use crate::utils::print_to_cons::print_to_js_with_obj;
use crate::web_file::cache_reader::CacheReader;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;
use parquet::errors::ParquetError;


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
        print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?} {:?}", "new_get_read()", "start", start, "length", length).into());
        let buf_read = CacheReader::init_reader(start, length, self.file_size as i32);
        Ok(buf_read)
    }
}

impl Length for WebFileChunkReader {

    fn len(&self) -> u64 {
        print_to_js_with_obj(&format!("{:?}", "length?").into());

        self.file_size
    }
}