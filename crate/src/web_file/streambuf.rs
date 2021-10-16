use js_sys::{Uint8Array};
use std::io::Result;
use std::io::{Read, Seek, SeekFrom};

use crate::bindings;
use crate::utils::print_to_cons::print_to_js_with_obj;

#[derive(Debug, Clone)]
pub struct Entry {
    file_offset: u64,
    buffer: Vec<u8>
}

pub struct WebFileReader {
    current_offset: u64,
    read_size: usize,
    file_length: u64,
    buffer: Vec<Entry>
}

impl WebFileReader {

    pub fn init_reader(offset: u64, file_size: i32) -> Self {
        Self {
            current_offset: offset,
            read_size: 0 as usize,
            file_length: file_size as u64,
            buffer: Vec::new()
        }
    }

    pub fn request_reader(&self, offset: u64, readsize: usize, file_size: i32) -> Self {
        Self {
            current_offset: offset,
            read_size: readsize,
            file_length: file_size as u64,
            buffer: self.buffer.clone()
        }
    }


    fn runtime_read_4kb(&mut self, out: &mut [u8]) -> Result<usize> {

        let array_length = out.len() as u64;
        let read_size = array_length.min(self.read_size as u64);

        if read_size == 0 {
            return Ok(read_size as usize);
        }
    
        let chunk = bindings::read_file_chunk(self.current_offset as i32, 70000);

        let mut index = 0;
        while index < read_size {
            out[index as usize] = Uint8Array::get_index(&chunk, index as u32);
            index += 1;
        }

        // Write into Buffer
        let entry = Entry{ file_offset: self.current_offset, buffer: chunk.to_vec() };
        self.buffer.push(entry);
    
        // Update offset
        self.current_offset += read_size as u64;

        print_to_js_with_obj(&format!("{:?} {:?}", "out", out).into());

        Ok(read_size as usize)
    }
}

impl Seek for WebFileReader {
    fn seek(&mut self, pos: SeekFrom) -> Result<u64> {
        self.current_offset = match pos {
            SeekFrom::Current(ofs) => self.current_offset + (self.file_length - self.current_offset).min(ofs as u64),
            SeekFrom::Start(ofs) => self.file_length.min(ofs as u64),
            SeekFrom::End(ofs) => self.file_length - self.file_length.min(ofs as u64),
        };
        Ok(self.current_offset)
    }

    fn stream_position(&mut self) -> std::io::Result<u64> {
        Ok(self.current_offset)
    }
}

impl Read for WebFileReader {

    fn read(&mut self, out: &mut [u8]) -> Result<usize> {

        let requested_offset = self.current_offset as usize;
        let requested_len = out.len();

        for entry in &self.buffer {

            let entry_offset = entry.file_offset as usize;
            let entry_len = entry.buffer.len();

            if requested_offset >= entry_offset && (requested_offset + requested_len) <= (entry_len + entry_offset) {

                print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?} {:?} {:?}", "buffer_length", entry.buffer.len(), "out", out, "entry", entry).into());

                print_to_js_with_obj(&format!("{:?} {:?}", "slice", [ (requested_offset - entry_offset)  ..  requested_len]).into());

                out.clone_from_slice(&entry.buffer[ (requested_offset - entry_offset)  ..  requested_len + 1]);

                print_to_js_with_obj(&format!("{:?} {:?}", "out", out).into());

                return Ok(out.len()); 
            }

        }

        return self.runtime_read_4kb(out);

    }
}
