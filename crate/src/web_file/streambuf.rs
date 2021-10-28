use js_sys::Uint8Array;
use std::io::Result;
use std::io::{Read, Seek, SeekFrom};

use crate::bindings;
use crate::utils::print_to_cons::print_to_js_with_obj;

pub struct WebFileReader {
    offset: u64,
    length: u64,
}

impl WebFileReader {
    pub fn new_from_file(offset: u64, file_size: i32) -> Self {
        Self {
            offset: offset,
            length: file_size as u64,
        }
    }
}

// Read implementation for WebFileReader
impl Read for WebFileReader {

    fn read_to_end(&mut self, buf: &mut Vec<u8>) -> Result<usize> {
/*         print_to_js_with_obj(&format!("read to end {:?}", buf.len()).into());
 */        self.read(buf)
    }

    fn read_exact(&mut self, buf: &mut [u8]) -> Result<()> {
/*         print_to_js_with_obj(&format!("read exact {:?}", buf.len()).into());
 */        self.read(buf);
        Ok(())
        
    }

    fn read(&mut self, out: &mut [u8]) -> Result<usize> {
        let read_size = out.len() as u64;

/*         print_to_js_with_obj(&format!("requested size {:?}", out.len()).into());
 */
        let chunk = bindings::read_file_chunk(self.offset as i32, read_size as i32);


        let mut index = 0;
        while index < read_size {
                out[index as usize] = Uint8Array::get_index(&chunk, index as u32);
                index += 1;
         }
    


        // Update offset
        self.offset += read_size as u64;
        Ok(read_size as usize)
    }
}
