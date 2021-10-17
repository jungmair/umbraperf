use js_sys::Uint8Array;
use std::io::Result;

use crate::bindings;
use crate::utils::print_to_cons::print_to_js_with_obj;

pub struct WebFileReader {
    pub offset: u64
}

impl WebFileReader {
    
    pub fn init_reader(offset: u64) -> Self {
        Self {
            offset: offset
        }
    }

    pub fn read_from_js(&mut self, out: &mut [u8]) -> Result<usize> {

        let read_size = out.len();

        print_to_js_with_obj(&format!("{:?} {:?} {:?}", "read()", "readsize", read_size).into());

        let chunk = bindings::read_file_chunk(self.offset as i32, read_size as i32);
        let len = Uint8Array::byte_length(&chunk);

        let mut index = 0;
        while index < len {
                out[index as usize] = Uint8Array::get_index(&chunk, index as u32);
                index += 1;
        }

        Ok(read_size as usize)
    }
}
