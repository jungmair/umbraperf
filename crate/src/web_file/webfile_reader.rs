use js_sys::Uint8Array;
use std::io::Result;

use crate::bindings;


pub struct WebFileReader {
    pub start_to_read: usize
}

impl WebFileReader {
    
    pub fn init_reader(start_to_read: usize) -> Self {
        Self {
            start_to_read
        }
    }

    pub fn read_from_js(&mut self, out: &mut [u8]) -> Result<usize> {

        let read_size = out.len();

        let chunk = bindings::read_file_chunk(self.start_to_read as i32, read_size as i32);

        let mut index = 0;
        while index < read_size {
                out[index as usize] = Uint8Array::get_index(&chunk, index as u32);
                index += 1;
        }

        Ok(read_size as usize)
    }
}
