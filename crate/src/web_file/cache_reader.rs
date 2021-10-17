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
    offset: u64,
    read_size: usize,
    buffer: Vec<Entry>,
}

impl CacheReader {

    pub fn init_reader(offset: u64, read_size: usize, file_size: i32) -> Self {
        Self {
            offset,
            read_size: read_size,
            buffer: Vec::new(),
        }
    }

}

impl Read for CacheReader {

    fn read(&mut self, out: &mut [u8]) -> Result<usize> {

        let requested_offset = self.offset as usize;
        let requested_len = out.len();

        //print_to_js_with_obj(&format!("{:?} {:?} {:?}", "read()", "readsize", read_size).into());
        print_to_js_with_obj(&format!("{:?} {:?}", "buffersize", self.buffer.len()).into());

        print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?}", "requested_offset", requested_offset, "requested_len or out", requested_len).into());


        for entry in &self.buffer {

            let entry_offset = entry.file_offset as usize;
            let entry_len = entry.buffer.len();

            print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?}", "entry_offset", entry_offset, "entry_len", entry_len).into());

            if requested_offset >= entry_offset && (requested_offset + requested_len) <= (entry_len + entry_offset) {

                print_to_js_with_obj(&format!("{:?} {:?} {:?} {:?}", "requested_offset", requested_offset, "entry_offset", entry_offset).into());

                print_to_js_with_obj(&format!("{:?} {:?}", "range", [(requested_offset - entry_offset) ..   (requested_offset - entry_offset) + requested_len + 1]).into());


                let mut index = 0;
                while index < requested_len {
                    out[index as usize] = entry.buffer[(requested_offset - entry_offset) ..  (requested_offset - entry_offset) + requested_len][index];
                    index += 1;
                }
    
                print_to_js_with_obj(&format!("{:?} {:?}", "out in buffer", out).into());
                print_to_js_with_obj(&format!("{:?} {:?}", "out in buffer len", out.len()).into());


                self.offset += requested_len as u64;

                return Ok(requested_len); 

            }

        }


        // read always more
        let mut out_buf = vec![0; 1024*8];

        let mut webfile_reader = WebFileReader::init_reader(requested_offset as u64);
        webfile_reader.read_from_js(&mut out_buf);
    

        print_to_js_with_obj(&format!("{:?} {:?}", "out buf", out_buf).into());

        // Write to Buffer
        let entry = Entry{ file_offset: self.offset, buffer: out_buf.to_vec() };
        self.buffer.push(entry);

        let mut index = 0;
        while index < out.len().min( 1024*8) {
                out[index as usize] = out_buf.to_vec()[index];
                index += 1;
        }

        self.offset += out.len().min( 1024*8) as u64;

        print_to_js_with_obj(&format!("{:?} {:?}", "send to outer world", out).into());

        return Ok(out.len().min( 1024*8))
    
    }
}