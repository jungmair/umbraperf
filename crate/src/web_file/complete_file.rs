use std::io::Read;

use futures::AsyncReadExt;

use crate::utils::print_to_cons::print_to_js_with_obj;
use std::io::Result;

use super::streambuf::WebFileReader;

pub struct CompleteFile {
    offset: u64,
}

static mut ARRAY: Vec<u8> = Vec::new();

impl CompleteFile {
    pub fn read_into_buffer(offset: u64, length: u64, filesize: i32) -> Self {
        print_to_js_with_obj(&format!("{:?}", length).into());

        unsafe {
            ARRAY.clear();
        }
        let mut reader = WebFileReader::new_from_file(offset, filesize);
        let mut start = 0;
        while start != length {
            let readsize = (8 * 1024).min(length - start) as usize;
            /*print_to_js_with_obj(&format!("{:?}", offset).into());
            print_to_js_with_obj(&format!("{:?}", readsize).into()); */
            let mut vec = vec![0; readsize];
            let result = reader.read(&mut vec);
            unsafe {
                ARRAY.append(&mut vec);
            }

            start = start + readsize as u64;
        }
        /* unsafe {
            print_to_js_with_obj(&format!("ARRAY {:?}", ARRAY.len()).into());
        } */
        /*         print_to_js_with_obj(&format!("{:?}", "Finished").into());
         */
        Self { offset: 0 }
    }
}

impl Read for CompleteFile {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let read_size = buf.len();

        unsafe {
            if (self.offset as usize) + read_size > ARRAY.len() {
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
            buf.clone_from_slice(&ARRAY[self.offset as usize..(self.offset as usize) + read_size]);
        }

        self.offset = self.offset + (read_size as u64);

        Ok(read_size)
    }
}
