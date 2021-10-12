use crate::web_file::streambuf::WebFileReader;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;

pub struct WebFileChunkReader {
   
}

impl WebFileChunkReader {
    pub fn new() -> Self {
        Self {}
    }
}

impl ChunkReader for WebFileChunkReader {
    type T = WebFileReader;

    fn get_read(&self, start: u64, length: usize) -> Result<WebFileReader, parquet::errors::ParquetError> { //-> Result<Self::T> {
        //Ok(new_from_file(start))
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        0
    }
}