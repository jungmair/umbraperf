use crate::utils::print_to_cons::print_to_js_with_obj;
use crate::web_file::streambuf::WebFileReader;
use parquet::file::reader::ChunkReader;
use parquet::file::reader::Length;
use parquet::errors::Result;
use parquet::errors::ParquetError;


pub struct WebFileChunkReader {
    length: u64,
    reader: WebFileReader
}

impl WebFileChunkReader {
    pub fn new(file_size: i32) -> Self {
        Self {
            length: file_size as u64,
            reader: WebFileReader::init_reader(0, file_size)
        }
    }
}

impl ChunkReader for WebFileChunkReader {

    type T = WebFileReader;

    fn get_read(&self, start: u64, length: usize) -> Result<WebFileReader> {
        if start as usize + length as usize > self.length as usize {
            return Err(ParquetError::EOF("End of file".to_string()));
        }

        print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?}", "start", start, "length", length).into());

        let reader = self.reader.request_reader(start, length, self.length as i32);
        Ok(reader)
    }
}

impl Length for WebFileChunkReader {
    fn len(&self) -> u64 {
        self.length
    }
}