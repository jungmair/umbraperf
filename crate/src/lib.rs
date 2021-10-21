// Wasm Bindgen
extern crate wasm_bindgen;
use parquet::file::serialized_reader::SerializedFileReader;
use utils::print_to_cons::print_to_js_with_obj;
use wasm_bindgen::prelude::*;
use web_file::streambuf::WebFileReader;

// Aux
extern crate console_error_panic_hook;
use std::collections::HashMap;
use std::{cell::RefCell};

// Arrow
extern crate arrow;
use arrow::{
    record_batch::RecordBatch,
};

// Stream Buff
mod web_file {
    pub mod streambuf;
    pub mod webfile_chunk_reader;
}

// Analyze
mod exec {
    pub mod freq {
        pub mod rel_freq;
        pub mod abs_freq;
    }
    pub mod basic {
        pub mod analyze;
        pub mod count;
    }
    pub mod rest_api;
}
use exec::rest_api;

// Utils
mod utils {
    pub mod bindings;
    pub mod record_batch_util;
    pub mod print_to_cons;
}

use utils::bindings;
use utils::record_batch_util;
use crate::utils::bindings::notify_js_finished_reading;


//STATE
pub struct State {
    pub record_batches: Option<RecordBatch>,
    pub queries: HashMap<String, RecordBatch>,
    pub web_file_reader: WebFileReader
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State {
        record_batches: None,
        queries: HashMap::new(),
        web_file_reader: WebFileReader::new_from_file(0, 0, 0)
    });
}

// STATE ACCESS
fn with_state<Callback, ReturnType>(cb: Callback) -> ReturnType
where
    Callback: FnOnce(&State) -> ReturnType,
{
    STATE.with(|s| cb(&s.borrow()))
}

fn _with_state_mut<Callback, ReturnType>(cb: Callback) -> ReturnType
where
    Callback: FnOnce(&mut State) -> ReturnType,
{
    STATE.with(|s| cb(&mut s.borrow_mut()))
}

fn get_record_batches() -> Option<RecordBatch> {
    with_state(|s| s.record_batches.clone())
}

fn get_query_from_cache() -> HashMap<String, RecordBatch> {
    with_state(|s| s.queries.clone())
}

fn get_webfile_reader() -> WebFileReader {
    with_state(|s| s.web_file_reader.clone())
}

fn set_webfile_reader(reader: WebFileReader) {
    _with_state_mut(|s| s.web_file_reader = reader);
}

fn clear_cache() {
    _with_state_mut(|s| s.queries.clear());
}

fn insert_query_to_cache(restful_string: &str, record_batch: RecordBatch) {
    _with_state_mut(|s| s.queries.insert(restful_string.to_string(), record_batch));
}

fn set_record_batches(record_batches: RecordBatch) {
    _with_state_mut(|s| s.record_batches = Some(record_batches));
}

#[wasm_bindgen(js_name = "analyzeFile")]
pub fn analyze_file(file_size: i32) {
    let now = instant::Instant::now();

    clear_cache();

    let batches = record_batch_util::init_record_batches(
        file_size,
        59, // Code for semicolon
        true,
        vec![0, 5, 13, 20],
    );

    let elapsed = now.elapsed();
    print_to_js_with_obj(&format!("{:?}", elapsed).into());

    let record_batch = record_batch_util::convert(batches);
    set_record_batches(record_batch);

    notify_js_finished_reading(0);
}

#[wasm_bindgen(js_name = "requestChartData")]
pub fn request_chart_data(rest_query: &str) {
    rest_api::eval_query(get_record_batches().unwrap(), rest_query);
}

