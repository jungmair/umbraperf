use js_sys::Uint8Array;
use std::io::Result;
use std::io::{Read, Seek, SeekFrom};

use crate::bindings;
use crate::utils::print_to_cons::print_to_js_with_obj;

struct Entry {
    buffer: Vec<u8>,
}

pub struct WebFileReader {
    start_position: u64,
    offset: u64,
    length: u64,
    buffer: Vec<u8>,
}

impl WebFileReader {
    pub fn new_from_file(start_position: u64, offset: u64, file_size: i32) -> Self {
        Self {
            start_position: start_position,
            offset: offset,
            length: file_size as u64,
            buffer: Vec::new(),
        }
    }

    pub fn read_into_buffer(&mut self, out: &mut [u8]) -> Result<usize> {

        let array_length = out.len() as u64;
        let read_size = array_length.min(self.length - self.offset);
        if read_size == 0 {
            return Ok(read_size as usize);
        }

        print_to_js_with_obj(
            &format!("offset:{:?} array_length:{:?} readsize:{:?}", self.offset, array_length, read_size).into(),
        );

        if self.buffer.len() > 0 {

            let range = [self.offset as usize - self.start_position as usize
            ..self.offset as usize + read_size as usize];

            print_to_js_with_obj(&format!("range:{:?}", range ).into());


            let buffer = &self.buffer[self.offset as usize - self.start_position as usize
                ..self.offset as usize + read_size as usize];
            out.copy_from_slice(&buffer);

            print_to_js_with_obj(&format!("out:{:?} buffer:{:?}", out, self.buffer ).into());


        } else {
            let chunk = bindings::read_file_chunk(self.offset as i32, read_size as i32);

            let mut index = 0;
            while index < read_size {
                out[index as usize] = Uint8Array::get_index(&chunk, index as u32);
                index += 1;
            }

            self.buffer = chunk.to_vec();
        }

        // Update offset
        //self.offset += read_size as u64;
        Ok(read_size as usize)
    }
}

// Read implementation for WebFileReader
impl Read for WebFileReader {

    fn read(&mut self, out: &mut [u8]) -> Result<usize> {

      
        let array_length = out.len() as u64;
        let read_size = array_length.min(self.length - self.offset);
        if read_size == 0 {
            return Ok(read_size as usize);
        }

        /* print_to_js_with_obj(
            &format!("offset:{:?} array_length:{:?} readsize:{:?}", self.offset, array_length, read_size).into(),
        ); */

        if self.buffer.len() > 0 {

           /*  print_to_js_with_obj(
                &format!("current buffer:{:?} length {:?} ", self.buffer, self.buffer.len()).into(),
            ); */

            let range = [self.offset as usize - self.start_position as usize
            ..(self.offset as usize - self.start_position as usize) + read_size as usize];

/*             print_to_js_with_obj(&format!("range:{:?}", range ).into());
 */

            let buffer = &self.buffer[self.offset as usize - self.start_position as usize
                ..(self.offset as usize - self.start_position as usize) + read_size as usize];
            out.copy_from_slice(&buffer);

/*             print_to_js_with_obj(&format!("out:{:?} buffer:{:?}", out, self.buffer ).into());
 */

        } else {
            let chunk = bindings::read_file_chunk(self.offset as i32, read_size as i32);

            let mut index = 0;
            while index < read_size {
                out[index as usize] = Uint8Array::get_index(&chunk, index as u32);
                index += 1;
            }

            self.buffer = chunk.to_vec();
        }

        // Update offset
        self.offset += read_size as u64;
        Ok(read_size as usize)
    }
}
