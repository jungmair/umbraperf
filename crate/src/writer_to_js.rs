use std::io::{Write};
use std::io::Result;
use js_sys::Uint8Array;


use crate::bindings;

pub struct ArrowResultWriter {
}

impl ArrowResultWriter {
    pub fn new() -> Self {
        Self {
            }
    }
}

impl Write for ArrowResultWriter {

    fn write(&mut self, buf: &[u8]) -> Result<usize> {
        bindings::write_result_to_js(Uint8Array::from(buf));
        Ok(2 as usize)
    }

    fn flush(&mut self) -> Result<()> {
        todo!()
    }

}
