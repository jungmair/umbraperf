use std::io::{BufReader, Read};
use std::io::Result;

use crate::utils::print_to_cons::print_to_js_with_obj;

use super::streambuf::WebFileReader;


#[derive(Debug, Clone)]
pub struct Entry {
    file_offset: u64,
    buffer: Vec<u8>
}

pub struct CacheReader {
    current_offset: u64,
    read_size: usize,
    file_length: u64,
    buffer: Vec<Entry>,
    reader: WebFileReader
}

impl CacheReader {

    pub fn init_reader(offset: u64, file_size: i32) -> Self {
        Self {
            current_offset: offset,
            read_size: 0 as usize,
            file_length: file_size as u64,
            buffer: Vec::new(),
            reader: WebFileReader::new_from_file(offset, file_size)
        }
    }

    pub fn  request_reader(&self, offset: u64, readsize: usize) -> Self {
        Self {
            current_offset: offset,
            read_size: readsize,
            file_length: self.file_length,
            buffer: self.buffer.clone(),
            reader: WebFileReader::new_from_file(offset, self.file_length as i32)
        }
    }

}

impl Read for CacheReader {

    fn read(&mut self, out: &mut [u8]) -> Result<usize> {

        let requested_offset = self.current_offset as usize;
        let requested_len = out.len();

        //print_to_js_with_obj(&format!("{:?} {:?} {:?}", "read()", "readsize", read_size).into());
        print_to_js_with_obj(&format!("{:?} {:?}", "buffersize", self.buffer.len()).into());

        print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?}", "requested_offset", requested_offset, "requested_len", requested_len).into());


        for entry in &self.buffer {

            let entry_offset = entry.file_offset as usize;
            let entry_len = entry.buffer.len();

            print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?}", "entry_offset", entry_offset, "entry_len", entry_len).into());


            if requested_offset >= entry_offset && (requested_offset + requested_len) <= (entry_len + entry_offset) {


                out.clone_from_slice(&entry.buffer[ (requested_offset - entry_offset)  ..  requested_len]);

                print_to_js_with_obj(&format!("{:?} {:?}", "out in buffer", out).into());

                return Ok(out.len()); 

            }

        }


        // read always more
        let mut out_buf = vec![0; 170000];
        print_to_js_with_obj(&format!("{:?} {:?}", "current offset of reader", self.reader.offset).into());
        print_to_js_with_obj(&format!("{:?} {:?}", "current length of reader", self.reader.length).into());

        let result = self.reader.read(&mut out_buf);
    

        print_to_js_with_obj(&format!("{:?} {:?}", "out buf", out_buf).into());
        print_to_js_with_obj(&format!("{:?} {:?}", "Now this is in the buffer", result).into());

        // Write to Buffer
        let entry = Entry{ file_offset: self.current_offset, buffer: out_buf.to_vec() };
        self.buffer.push(entry);

        out.clone_from_slice(&out_buf.to_vec()[ (requested_offset - self.current_offset as usize)  ..  requested_len]);

        // return only needed
        return Ok(out.len())
    
    }
}