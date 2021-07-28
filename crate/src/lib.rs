extern crate wasm_bindgen;

use arrow::array::{Array, UInt8Array};
use arrow::csv::reader;
use futures::{AsyncBufReadExt, AsyncRead, AsyncReadExt, AsyncSeekExt, TryFutureExt};
use futures::io::{BufReader, Cursor};
use js_sys::{Uint8Array};
use std::cell::RefCell;
use std::fs::File;
use std::io::{BufRead, Read, SeekFrom};
use std::{io};
use wasm_bindgen::prelude::*;

extern crate arrow;
use arrow::datatypes::{DataType, Field, Schema};


extern crate console_error_panic_hook;
use std::panic;

use std::sync::Arc;

mod console;

pub struct State {
    pub vec: Vec<u8>,
    pub processed_chunks: i32,
    pub expected_chunks: i32,
    pub sum: i32,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State {
        vec: Vec::new(),
        processed_chunks: 0,
        expected_chunks: 0,
        sum: 0,
    });
}

fn with_state<Callback, ReturnType>(cb: Callback) -> ReturnType
where
    Callback: FnOnce(&State) -> ReturnType,
{
    STATE.with(|s| cb(&s.borrow()))
}

fn with_state_mut<Callback, ReturnType>(cb: Callback) -> ReturnType
where
    Callback: FnOnce(&mut State) -> ReturnType,
{
    STATE.with(|s| cb(&mut s.borrow_mut()))
}

pub fn get_state() -> i32 {
    with_state(|s| s.sum)
}

pub fn set_expected_chunks(expected_chunks: i32) -> i32 {
    with_state_mut(|s| {
        s.expected_chunks = expected_chunks;
    });
    return 0;
}


#[wasm_bindgen(js_name = "triggerScanFile")]
pub async fn scan_file(p: Web_File) -> Result<(), js_sys::Error> {
    
    unsafe { web_sys::console::log_1(&format!("Scan File triggered").into()) };
    let mut from: i32 = 0;
    let size: i32 = 4000;
    loop {
        unsafe { web_sys::console::log_1(&format!("{:?}", &from).into()) };
        unsafe { web_sys::console::log_1(&format!("{:?}", &size).into()) };
        let array = read_chunk(&p, from, size).await?;
        unsafe { web_sys::console::log_1(&array) };
        if array.to_vec().len() == 0 {
            unsafe { web_sys::console::log_1(&format!("End of File").into()) };
            return Ok(())
        } else {

            unsafe { web_sys::console::log_1(&format!("Chunk is processed to Batch").into()) };


            //let mut cursor = io::Cursor::new(array.to_vec());
            let mut async_cursor = futures::io::Cursor::new(array.to_vec());
            unsafe { web_sys::console::log_1(&format!("{:?}", &async_cursor).into()) };

            let mut reader = BufReader::with_capacity(4000, async_cursor);
            //reader.take(400);
            
            let mut buf = Vec::with_capacity(2000);
            let mut string = String::from_utf8(buf).expect("Found invalid UTF-8");
            let mut old_size  = 0;
            loop {
                reader.read_line(&mut string).await.unwrap();
                if old_size == string.len() {
                    break;
                }
                old_size = string.len();
                unsafe { web_sys::console::log_1(&format!("{:?}", &string).into()) };
            } 


            //let mut buf = vec![];

            //cursor.read_to_end(&mut buf);


           
            let arrow_reader_builder = arrow::csv::reader::ReaderBuilder::new();
            let cursor_reader =  arrow::csv::reader::ReaderBuilder::build(arrow_reader_builder,io::Cursor::new(string));
            let mut reader = cursor_reader.unwrap();

            unsafe { web_sys::console::log_1(&format!("Reader is build").into()) };
            let batch = &reader.next().unwrap().unwrap();
            let column = batch.column(0);
            unsafe { web_sys::console::log_1(&format!("{:?}", &batch).into()) };

/*             let batch = &reader.next().unwrap().unwrap();
/*  */            let column = batch.column(0);
/*  */            aggregate_batch_column(column);
 */            
/*             unsafe { web_sys::console::log_1(&format!("{:?}", &batch).into()) };
 */            from += size;
        }
    }
}

//TODO
pub fn aggregate_batch_column(array: &Arc<dyn Array>) -> i64 {
    0
}

async fn read_chunk(p: &Web_File, from: i32, to: i32) -> Result<Uint8Array, js_sys::Error> {

    let array = p.ask_js_for_chunk(from, to).await?.into();  
    unsafe { web_sys::console::log_1(&format!("Print js-chunk").into()) };
    unsafe { web_sys::console::log_1(&format!("{:?}",&array).into()) };
    Ok(array)
}

#[wasm_bindgen(raw_module = "../../src/model/web_file", js_name="web_file")]
extern "C" {

    #[wasm_bindgen(js_name = "WebFile")]
    pub type Web_File;

    #[wasm_bindgen(method,catch, js_name = "askJsForChunk")]
    async fn ask_js_for_chunk(this: &Web_File, offset: i32, chunkSize: i32) -> Result<JsValue, JsValue>;

}

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    // log::set_logger(&DEFAULT_LOGGER).unwrap();
    // log::set_max_level(log::LevelFilter::Info);
}
