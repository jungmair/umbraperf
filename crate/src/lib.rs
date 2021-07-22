extern crate wasm_bindgen;

use arrow::array::UInt16Array;
use csv::ReaderBuilder;
use futures::*;
use js_sys::{JSON, Uint8Array};
use std::cell::RefCell;
use std::{io, str};
use wasm_bindgen::prelude::*;
use std::io::Cursor;
use std::io::*;

extern crate arrow;
use arrow::*;
use std::fs::File;
use std::io::Error;
use js_sys::Promise as js_promise;
use std::result as r;


extern crate console_error_panic_hook;
use std::panic;

use arrow::datatypes::{DataType, Field, Schema};
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

/* fn createBuilder(chunk: &Uint8Array) -> a::reader::Reader<Cursor<Vec<u8>>> {
    
    let buff = Cursor::new(chunk.to_vec());

    //let file = File::open("test/data/uk_cities_with_headers.csv").unwrap();

    let schema = Schema::new(vec![
        Field::new("Test", DataType::Int64, false)
    
    ]);

    let reader = a::reader::Reader::new(buff, Arc::new(schema), false, None, 1000, None, None);


    // create a builder, inferring the schema with the first 100 records
    
    //let builder:a::reader::ReaderBuilder = a::reader::ReaderBuilder::new().infer_schema(Some(100));
    
    //builder.has_headers(true);
    //builder.with_deliminator(',');
    //builder.with_batch_size(4000);

    //let reader = builder.build(buff.seek()).unwrap();
   
    print_to_console(&format!("Hey, went into apache arrow reader").into());

    reader
} */

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

#[wasm_bindgen(js_name = "notifyRustNewFile")]
pub fn notify_rust_new_file(){
    consume_chunk_active();
}

pub fn consume_chunk_active(){
    print_to_console(&format!("HERE").into());
    let resolvePromise = rustfunc();

    match resolvePromise {
        Ok(x) => {
            print_to_console(&format!("{:?}",&x).into());
            let y = js_promise::resolve(&x);
            print_to_console(&format!("{:?}",&y).into());
           

        }
        Err(x) => {

        }
    }
   /*  let uint8vec = rustfunc().to_vec();
    print_to_console(&format!("HERE").into());
    print_to_console(&format!("{:?}",uint8vec).into());
    consume_chunk(&uint8); */
}

pub fn consume_chunk(chunk: &Uint8Array) {
    
    //Read csv via curser
  /*   let mut csvReader = createBuilder(chunk); */
/*     let _batch = csvReader.next().unwrap().unwrap();
 */

    rustfunc();
    let buffer: Vec<u8> = chunk.to_vec();
    let linebreak: u8 = 10;

    let mut iterator = buffer.iter();
    let mut binary_vec = Vec::new();

    with_state_mut(|s| {
        if s.vec.len() > 0 {
            for v in s.vec.iter() {
                binary_vec.push(*v);
            }
        }
    });

    // loop through buffer
    loop {
        match iterator.next() {
            Some(i) => {
                // if linebreak is found process binary vector else push it to vector for later processing
                if i == &linebreak {
                    with_state_mut(|sg| {
                        process_chunk(sg, binary_vec);
                    });
                    binary_vec = Vec::new();
                } else {
                    &binary_vec.push(*i);
                }
            }
            // may be end of file or end of chunk
            None => {
                let done = with_state_mut(|sg| {
                    sg.processed_chunks += 1;
                    // end of file
                    if sg.expected_chunks == sg.processed_chunks {
                        if binary_vec.len() > 0 {
                            process_chunk(sg, binary_vec);
                        }
                        sg.processed_chunks = 0;
                        sg.sum = 0;
                        sg.vec = Vec::new();
                        return true;
                    // end of chunk
                    } else {
                        // push line break of chunk to global state
                        sg.vec = Vec::new();
                        for v in binary_vec.iter() {
                            sg.vec.push(*v);
                        }
                        print_to_console(&format!("Chunk ends").into());
                        return false;
                    }
                });
                if done {
                    // notify JS about finish and reset variables and notify JS about finish
                    print_to_console(&format!("File ends").into());
                }
                break;
            }
        }
    }
}

pub fn process_chunk(state: &mut State, vec: Vec<u8>) {
    // convert to String
    let s = str::from_utf8(&vec).expect("Invalid UTF-8 sequence.");
 /*    // reader
    let mut rdr = ReaderBuilder::new()
        .delimiter(b',')
        .has_headers(false)
        .from_reader(s.as_bytes());

    // calculate
    for result in rdr.records() {
        let record = result.expect("CSV record");
        let number = &record[1].parse::<i32>().expect("u64");

        state.sum = state.sum + number;
        print_to_console(&format!("COUNTER: {:?}", state.sum).into());
    } */
    print_to_console(&format!("BINARY: {:?}", &vec).into());
    print_to_console(&format!("STRING: {:?}", &s).into());
}

pub fn print_to_console(str: &JsValue) {
    unsafe { web_sys::console::log_1(str) };
}

fn rustfunc() -> r::Result<JsValue, JsValue> {
    unsafe {
        let t = Parquet::getClass();
        let x = t.passNextToCore();
        print_to_console(&format!("HERE2").into());
       /*  let output = wasm_bindgen_futures::JsFuture::from(result).await?; */
/*         let output = executor::block_on(x);
 */        print_to_console(&format!("HERE3").into());
        x
    }
}


#[wasm_bindgen(raw_module="../../src/components/parquet")]
extern "C" {
    type Parquet;

    #[wasm_bindgen(constructor)]
    fn getClass() -> Parquet;

    #[wasm_bindgen(method,catch)]
    fn passNextToCore(this: &Parquet) -> r::Result<JsValue,JsValue>;

}


#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    // log::set_logger(&DEFAULT_LOGGER).unwrap();
    // log::set_max_level(log::LevelFilter::Info);
}
