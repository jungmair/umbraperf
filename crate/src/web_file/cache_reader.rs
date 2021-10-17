use std::io::{BufReader, Read};
use std::io::Result;

use crate::utils::print_to_cons::print_to_js_with_obj;
use crate::web_file::webfile_reader::WebFileReader;


#[derive(Debug, Clone)]
pub struct Entry {
    file_offset: u64,
    buffer: Vec<u8>
}

pub struct CacheReader {
    starting_offset: u64,
    read_size: usize,
    buffer: Vec<Entry>,
}

impl CacheReader {

    pub fn init_reader(offset: u64, read_size: usize, file_size: i32) -> Self {
        Self {
            starting_offset: offset,
            read_size: read_size,
            buffer: Vec::new(),
        }
    }

}

impl Read for CacheReader {

    fn read(&mut self, out: &mut [u8]) -> Result<usize> {

        let requested_offset = self.starting_offset as usize;
        let requested_len = out.len();

        //print_to_js_with_obj(&format!("{:?} {:?} {:?}", "read()", "readsize", read_size).into());
        print_to_js_with_obj(&format!("{:?} {:?}", "buffersize", self.buffer.len()).into());

        print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?}", "requested_offset", requested_offset, "requested_len or out", requested_len).into());


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

        let mut webfile_reader = WebFileReader::init_reader(requested_offset as u64);
        webfile_reader.read_from_js(&mut out_buf);
    

        print_to_js_with_obj(&format!("{:?} {:?}", "out buf", out_buf).into());

        // Write to Buffer
        let entry = Entry{ file_offset: self.starting_offset, buffer: out_buf.to_vec() };
        self.buffer.push(entry);

        out.clone_from_slice(&out_buf.to_vec()[ (requested_offset - self.starting_offset as usize)  ..  requested_len]);

        print_to_js_with_obj(&format!("{:?} {:?}", "send to outer world", out).into());

        return Ok(out.len())
    
    }
}