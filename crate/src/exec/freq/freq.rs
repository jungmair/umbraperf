use std::{collections::HashMap, convert::TryInto, sync::Arc};

use arrow::{
    array::{
        Float64Array, GenericStringArray, Int32Array, Int64Array, PrimitiveArray, StringArray,
    },
    datatypes::{DataType, Float64Type, Int64Type},
    record_batch::RecordBatch,
};

use crate::{
    exec::basic::basic::{find_unique_string, sort_batch},
    get_record_batches,
    utils::{print_to_cons::print_to_js_with_obj, record_batch_util::create_new_record_batch},
};

pub enum Freq {
    ABS,
    REL,
}

pub fn create_freq_bucket(
    record_batch: &RecordBatch,
    column_for_operator: usize,
    time_bucket: Vec<f64>,
    result_vec_operator: Vec<&str>,
    count: Vec<f64>,
    freq: Freq,
) -> RecordBatch {
    let time_bucket = Float64Array::from(time_bucket);
    let operator_arr = StringArray::from(result_vec_operator);
    let count_arr = Float64Array::from(count);

    // Record Batch
    let schema = record_batch.schema();
    let column_for_operator_name = schema.field(column_for_operator).name();

    let freq_name;
    if matches!(freq, Freq::REL) {
        freq_name = "relfreq";
    } else {
        freq_name = "absfreq";
    }
    create_new_record_batch(
        vec!["bucket", column_for_operator_name, freq_name],
        vec![DataType::Float64, DataType::Utf8, DataType::Float64],
        vec![
            Arc::new(time_bucket),
            Arc::new(operator_arr),
            Arc::new(count_arr),
        ],
    )
}

pub fn create_mem_bucket(
    record_batch: &RecordBatch,
    column_for_operator: usize,
    result_bucket: Vec<f64>,
    result_vec_operator: Vec<&str>,
    result_vec_memory: Vec<i32>,
    result_builder: Vec<f64>,
) -> RecordBatch {
    let builder_bucket = Float64Array::from(result_bucket);
    let operator_arr = StringArray::from(result_vec_operator);
    let memory_arr = Int32Array::from(result_vec_memory);
    let builder_result = Float64Array::from(result_builder);

    // Record Batch
    let schema = record_batch.schema();
    let column_for_operator_name = schema.field(column_for_operator).name();

    create_new_record_batch(
        vec!["bucket", column_for_operator_name, "mem", "freq"],
        vec![
            DataType::Float64,
            DataType::Utf8,
            DataType::Int32,
            DataType::Float64,
        ],
        vec![
            Arc::new(builder_bucket),
            Arc::new(operator_arr),
            Arc::new(memory_arr),
            Arc::new(builder_result),
        ],
    )
}

pub fn get_stringarray_column(batch: &RecordBatch, column: usize) -> &GenericStringArray<i32> {
    let column = batch
        .column(column)
        .as_any()
        .downcast_ref::<StringArray>()
        .unwrap();
    return column;
}

pub fn get_floatarray_column(batch: &RecordBatch, column: usize) -> &PrimitiveArray<Float64Type> {
    let column = batch
        .column(column)
        .as_any()
        .downcast_ref::<Float64Array>()
        .unwrap();
    return column;
}

pub fn get_int_column(batch: &RecordBatch, column: usize) -> &PrimitiveArray<Int64Type> {
    let column = batch
        .column(column)
        .as_any()
        .downcast_ref::<Int64Array>()
        .unwrap();
    return column;
}

pub fn current_pipe_in(current_pipeline: &str, pipelines: &Vec<&str>) -> bool {
    return pipelines.contains(&current_pipeline)
        || pipelines.len() == 0
        || (pipelines.len() == 1 && pipelines[0] == "All");
}

pub fn current_op_in(current_operator: &str, operators: &Vec<&str>) -> bool {
    return (operators.len() == 1 && operators[0] == "All")
        || operators.contains(&current_operator)
        || operators.len() == 0;
}

pub fn init_time_bucket(from: f64) -> f64 {
    let time_bucket;
    if from == -1. {
        time_bucket = 0.;
    } else {
        time_bucket = from;
    }
    f64::trunc(time_bucket)
}

pub fn init_bucket_map<'a>(
    vec_operator: &'a GenericStringArray<i32>,
    freq: &Freq,
) -> HashMap<&'a str, f64> {
    let mut bucket_map = HashMap::new();
    for operator in vec_operator {
        bucket_map.insert(operator.unwrap(), 0.0);
    }

    if matches!(freq, Freq::REL) {
        bucket_map.insert("sum", 0.0);
    }
    return bucket_map;
}

pub fn write_into<'a>(
    vec_operator: &'a GenericStringArray<i32>,
    time_vec: &mut Vec<f64>,
    operator_vec: &mut Vec<&'a str>,
    freq_vec: &mut Vec<f64>,
    freq: &Freq,
    bucket_map: &mut HashMap<&'a str, f64>,
    time_bucket: &f64,
) {
    for operator in vec_operator {
        let operator = operator.unwrap();
        time_vec.push(f64::trunc((time_bucket) * 100.0) / 100.0);
        operator_vec.push(operator);

        if matches!(freq, Freq::ABS) {
            let frequenzy = bucket_map.get(operator).unwrap();
            freq_vec.push(frequenzy.to_owned());
        } else {
            if bucket_map.get(operator).unwrap() == &0.0 {
                let frequenzy = 0.0;
                freq_vec.push(frequenzy);
            } else {
                let frequenzy = bucket_map.get(operator).unwrap() / bucket_map.get("sum").unwrap();
                let frequenzy_rounded = f64::trunc(frequenzy * 100.0) / 100.0;
                freq_vec.push(frequenzy_rounded);
            }
        }
        // reset bucket_map
        bucket_map.insert(operator, 0.0);
    }
    if matches!(freq, Freq::REL) {
        bucket_map.insert("sum", 0.0);
    }
}

pub fn update<'a>(
    freq: &Freq,
    current_pipeline: &str,
    pipelines: &Vec<&str>,
    current_operator: &'a str,
    operators: &Vec<&str>,
    bucket_map: &mut HashMap<&'a str, f64>,
) {
    if current_op_in(current_operator, &operators) && current_pipe_in(current_pipeline, &pipelines)
    {
        bucket_map.insert(
            current_operator,
            bucket_map.get(current_operator).unwrap() + 1.0,
        );
    }

    if matches!(freq, Freq::REL) {
        bucket_map.insert("sum", bucket_map.get("sum").unwrap() + 1.0);
    }
}

pub fn freq_of_pipelines_new(
    batch: &RecordBatch,
    freq: Freq,
    column_for_operator: usize,
    column_for_time: usize,
    bucket_size: f64,
    pipelines: Vec<&str>,
    operators: Vec<&str>,
    from: f64,
    to: f64,
) -> RecordBatch {
    let mut time_vec = Vec::new();
    let mut operator_vec = Vec::new();
    let mut freq_vec = Vec::new();
    let operator_column = get_stringarray_column(batch, column_for_operator);
    let time_column = get_floatarray_column(batch, column_for_time);
    let pipeline_column = get_stringarray_column(batch, 3);

    let mut bucket_map = HashMap::new();

    for (i, time) in time_column.into_iter().enumerate() {
        let current_operator = operator_column.value(i);
        let current_pipeline = pipeline_column.value(i);
        if current_op_in(current_operator, &operators)
            && current_pipe_in(current_pipeline, &pipelines)
        {
            let bucket = time.unwrap() - (time.unwrap() % bucket_size);
            let inner_hashmap = bucket_map.entry(bucket as i32).or_insert(HashMap::new());
            inner_hashmap.entry(current_operator).or_insert(0.);
            inner_hashmap.insert(current_operator, inner_hashmap[current_operator] + 1.);
            if matches!(freq, Freq::REL) {
                inner_hashmap.entry("sum").or_insert(0.);
                inner_hashmap.insert("sum", inner_hashmap["sum"] + 1.);
            }
        }
    }

    for entry in bucket_map {
        for inner_entry in &entry.1 {
            if (matches!(freq, Freq::REL) && *inner_entry.0 != "sum") || matches!(freq, Freq::ABS)  {
                time_vec.push(entry.0 as f64);
                operator_vec.push(*inner_entry.0);
            }
            if matches!(freq, Freq::REL) && *inner_entry.0 != "sum" {
                freq_vec.push(inner_entry.1 / entry.1["sum"]);
            }
            if matches!(freq, Freq::ABS) {
                freq_vec.push(*inner_entry.1);
            }
        }
    }

    let batch = create_freq_bucket(
        &batch,
        column_for_operator,
        time_vec,
        operator_vec,
        freq_vec,
        freq,
    );

    let batch = &sort_batch(&batch, 0, false);
    print_to_js_with_obj(&format!("{:?}", batch).into());
    return batch.to_owned();
}

pub fn freq_of_pipelines(
    batch: &RecordBatch,
    freq: Freq,
    column_for_operator: usize,
    column_for_time: usize,
    bucket_size: f64,
    pipelines: Vec<&str>,
    operators: Vec<&str>,
    from: f64,
    to: f64,
) -> RecordBatch {
    let batch = &sort_batch(batch, 2, false);

    let unique_operator = find_unique_string(&get_record_batches().unwrap(), column_for_operator);
    let vec_operator = get_stringarray_column(&unique_operator, 0);

    let mut time_vec = Vec::new();
    let mut operator_vec = Vec::new();
    let mut freq_vec = Vec::new();
    let operator_column = get_stringarray_column(batch, column_for_operator);
    let time_column = get_floatarray_column(batch, column_for_time);
    let pipeline_column = get_stringarray_column(batch, 3);

    let mut time_bucket = init_time_bucket(from);
    let mut bucket_map = init_bucket_map(vec_operator, &freq);

    let mut column_index = 0;
    for (i, time) in time_column.into_iter().enumerate() {
        let current_operator = operator_column.value(column_index as usize);
        let current_pipeline = pipeline_column.value(column_index as usize);
        while time_bucket < time.unwrap() {
            write_into(
                vec_operator,
                &mut time_vec,
                &mut operator_vec,
                &mut freq_vec,
                &freq,
                &mut bucket_map,
                &time_bucket,
            );
            time_bucket += bucket_size;
        }

        update(
            &freq,
            current_pipeline,
            &pipelines,
            current_operator,
            &operators,
            &mut bucket_map,
        );

        if i == time_column.len() - 1 {
            while time_bucket < to {
                write_into(
                    vec_operator,
                    &mut time_vec,
                    &mut operator_vec,
                    &mut freq_vec,
                    &freq,
                    &mut bucket_map,
                    &time_bucket,
                );
                time_bucket += bucket_size;
            }
        }

        column_index += 1;
    }

    return create_freq_bucket(
        &batch,
        column_for_operator,
        time_vec,
        operator_vec,
        freq_vec,
        freq,
    );
}

pub fn freq_of_memory(
    batch: &RecordBatch,
    column_for_operator: usize,
    column_for_time: usize,
    bucket_size: f64,
    from: f64,
    to: f64,
) -> RecordBatch {
    print_to_js_with_obj(&format!("{:?}", "In Memory").into());

    let batch = &sort_batch(batch, 2, false);

    let unique_operator = find_unique_string(&get_record_batches().unwrap(), column_for_operator);

    let vec_operator = get_stringarray_column(&unique_operator, 0);

    let mut result_bucket = Vec::new();
    let mut result_vec_operator = Vec::new();
    let mut result_mem_operator: Vec<i32> = Vec::new();
    let mut result_builder = Vec::new();

    let operator_column = get_stringarray_column(batch, column_for_operator);
    let time_column = get_floatarray_column(batch, column_for_time);
    let memory_column = get_int_column(batch, 4);

    let mut time_bucket = init_time_bucket(from);

    time_bucket = f64::trunc(time_bucket);
    let mut column_index = 0;

    let mut bucket_map = HashMap::new();
    for operator in vec_operator {
        bucket_map.insert(operator.unwrap(), HashMap::<i64, f64>::new());
    }

    for (i, time) in time_column.into_iter().enumerate() {
        let current_operator = operator_column.value(column_index as usize);
        let current_memory = memory_column.value(column_index as usize) / 100000000;
        while time_bucket < time.unwrap() {
            for operator in vec_operator {
                let operator = operator.unwrap();

                let frequenzy = bucket_map.get(operator).unwrap();
                for item in frequenzy {
                    let times = *item.1 as i32;
                    for i in 0..times {
                        result_bucket.push(f64::trunc((time_bucket) * 100.0) / 100.0);
                        result_vec_operator.push(operator);
                        result_mem_operator.push(current_memory.try_into().unwrap());
                        result_builder.push(item.1.to_owned());
                    }
                }
                // reset bucket_map
                bucket_map.insert(operator, HashMap::new());
            }
            time_bucket += bucket_size;
        }

        let inner_hashmap = bucket_map.entry(current_operator).or_insert(HashMap::new());
        inner_hashmap.entry(current_memory).or_insert(0.);
        inner_hashmap.insert(current_memory, inner_hashmap[&current_memory] + 1.);

        if i == time_column.len() - 1 {
            while time_bucket < to {
                for operator in vec_operator {
                    let operator = operator.unwrap();

                    let frequenzy = bucket_map.get(operator).unwrap();
                    for item in frequenzy {
                        let times = *item.1 as i32;
                        for i in 0..times {
                            result_bucket.push(f64::trunc((time_bucket) * 100.0) / 100.0);
                            result_vec_operator.push(operator);
                            result_mem_operator.push(current_memory.try_into().unwrap());
                            result_builder.push(item.1.to_owned());
                        }
                    }
                    // reset bucket_map
                    bucket_map.insert(operator, HashMap::new());
                }
                time_bucket += bucket_size;
            }
        }

        column_index += 1;
    }

    let batch = create_mem_bucket(
        &batch,
        column_for_operator,
        result_bucket,
        result_vec_operator,
        result_mem_operator,
        result_builder,
    );

    batch
}
