use std::io::Read;

use crate::utils::print_to_cons::print_to_js_with_obj;
use std::io::Result;

use super::streambuf::WebFileReader;

pub struct CompleteFile {
    offset: u64,
    array: Vec<u8>
}

//static mut ARRAY: Vec<u8> = Vec::new();

impl CompleteFile {

    pub fn new() -> Self {
        Self { offset: 0,
            array: Vec::new()
         }
    }

    pub fn read_into_buffer(mut self, offset: u64, length: u64, filesize: i32) -> Self {
        print_to_js_with_obj(&format!("{:?}", length).into());

        let mut reader = WebFileReader::new_from_file(offset, filesize);
        let mut start = 0;
        while start != length {
            let readsize = (8 * 1024).min(length - start) as usize;
            /*print_to_js_with_obj(&format!("{:?}", offset).into());
            print_to_js_with_obj(&format!("{:?}", readsize).into()); */
            let mut vec = vec![0; readsize];
            let result = reader.read(&mut vec);
            unsafe {
                self.array.append(&mut vec);
            }

            start = start + readsize as u64;
        }
        /* unsafe {
            print_to_js_with_obj(&format!("ARRAY {:?}", ARRAY.len()).into());
        } */
        /*         print_to_js_with_obj(&format!("{:?}", "Finished").into());
         */
        Self { offset: 0,
            array: self.array
         }
    }
}

impl Read for CompleteFile {

    fn read_to_end(&mut self, buf: &mut Vec<u8>) -> Result<usize> {
/*         print_to_js_with_obj(&format!("read to end {:?}", buf.len()).into());
 */        self.read(buf)
    }

    fn read_exact(&mut self, buf: &mut [u8]) -> Result<()> {
/*         print_to_js_with_obj(&format!("read exact {:?}", buf.len()).into());
 */        let read_size = buf.len();

        unsafe {
            buf.clone_from_slice(&self.array[self.offset as usize..(self.offset as usize) + read_size]);
        }

        self.offset = self.offset + (read_size as u64);
        Ok(())
        
    }


    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let read_size = buf.len();
/*         print_to_js_with_obj(&format!("read {:?}", buf.len()).into());
 */
        unsafe {
            if (self.offset as usize) + read_size > self.array.len() {
                print_to_js_with_obj(&format!("read toooooooo much {:?}", buf.len()).into());

                return Ok(0);
            }
        }

        /* unsafe {
            print_to_js_with_obj(&format!("ARRAY {:?}", ARRAY.len()).into());
        }
        print_to_js_with_obj(
            &format!(
                "ARRAY {:?}",
                [self.offset as usize..(self.offset as usize) + read_size]
            )
            .into(),
        );

 */
        unsafe {
            buf.clone_from_slice(&self.array[self.offset as usize .. (self.offset as usize) + read_size]);
        }


        self.offset = self.offset + (read_size as u64);

        Ok(read_size)
    }
}
