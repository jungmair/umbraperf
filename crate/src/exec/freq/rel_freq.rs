use std::{collections::HashMap, sync::Arc};

use arrow::{
    array::{Float64Array, StringArray},
    datatypes::{DataType, Field, Schema},
    record_batch::RecordBatch,
};

use crate::{
    exec::basic::{
        analyze::{find_unique_string, sort_batch},
        filter,
    },
    get_record_batches,
};

pub fn create_rel_freq_bucket(
    record_batch: &RecordBatch,
    column_for_operator: usize,
    result_bucket: Vec<f64>,
    result_vec_operator: Vec<&str>,
    result_builder: Vec<f64>,
) -> RecordBatch {
    let builder_bucket = Float64Array::from(result_bucket);
    let operator_arr = StringArray::from(result_vec_operator);
    let builder_result = Float64Array::from(result_builder);

    // Record Batch
    let schema = record_batch.schema();
    let column_for_operator_name = schema.field(column_for_operator).name();

    let field_bucket = Field::new("bucket", DataType::Float64, false);
    let field_operator = Field::new(column_for_operator_name, DataType::Utf8, false);
    let result_field = Field::new("relfreq", DataType::Float64, false);

    let schema = Schema::new(vec![field_bucket, field_operator, result_field]);

    RecordBatch::try_new(
        Arc::new(schema),
        vec![
            Arc::new(builder_bucket),
            Arc::new(operator_arr),
            Arc::new(builder_result),
        ],
    )
    .unwrap()
}

pub fn rel_freq_with_pipelines(
    batch: &RecordBatch,
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

    // Vector of unique strings
    let vec_operator = unique_operator
        .column(0)
        .as_any()
        .downcast_ref::<StringArray>()
        .unwrap();

    let mut result_bucket = Vec::new();
    let mut result_vec_operator = Vec::new();
    let mut result_builder = Vec::new();

    let operator_column = batch
        .column(column_for_operator)
        .as_any()
        .downcast_ref::<StringArray>()
        .unwrap();
    let time_column = batch
        .column(column_for_time)
        .as_any()
        .downcast_ref::<Float64Array>()
        .unwrap();
    let pipeline_column = batch
        .column(3)
        .as_any()
        .downcast_ref::<StringArray>()
        .unwrap();

    let mut time_bucket;
    if from == -1. {
        time_bucket = arrow::compute::min(time_column).unwrap_or(0.);
    } else {
        time_bucket = from;
    }

    let mut column_index = 0;

    let mut bucket_map = HashMap::new();
    for operator in vec_operator {
        bucket_map.insert(operator.unwrap(), 0.0);
    }

    bucket_map.insert("sum", 0.0);

    for (i, time) in time_column.into_iter().enumerate() {
        let current_operator = operator_column.value(column_index as usize);
        let current_pipeline = pipeline_column.value(column_index as usize);
        while time_bucket <= time.unwrap() {
            for operator in vec_operator {
                let operator = operator.unwrap();
                result_bucket.push(f64::trunc((time_bucket) * 100.0) / 100.0);
                result_vec_operator.push(operator);
                if bucket_map.get(operator).unwrap() == &0.0 {
                    let frequenzy = 0.0;
                    result_builder.push(frequenzy);
                } else {
                    let frequenzy =
                        bucket_map.get(operator).unwrap() / bucket_map.get("sum").unwrap();
                    let frequenzy_rounded = f64::trunc(frequenzy * 100.0) / 100.0;
                    result_builder.push(frequenzy_rounded);
                }
                // reset bucket_map
                bucket_map.insert(operator, 0.0);
            }

            // reset sum
            bucket_map.insert("sum", 0.0);
            time_bucket += bucket_size;
        }

        if (pipelines.contains(&current_pipeline)
            || pipelines.len() == 0
            || (pipelines.len() == 1 && pipelines[0] == "All"))
            && (operators.contains(&current_operator)
                || operators.len() == 0
                || (operators.len() == 1 && operators[0] == "All"))
        {
            bucket_map.insert(
                current_operator,
                bucket_map.get(current_operator).unwrap() + 1.0,
            );
        }
        bucket_map.insert("sum", bucket_map.get("sum").unwrap() + 1.0);

        if i == time_column.len() - 1 {
            while time_bucket < to {
                for operator in vec_operator {
                    let operator = operator.unwrap();
                    result_bucket.push(f64::trunc((time_bucket) * 100.0) / 100.0);
                    result_vec_operator.push(operator);
                    if bucket_map.get(operator).unwrap() == &0.0 {
                        let frequenzy = 0.0;
                        result_builder.push(frequenzy);
                    } else {
                        let frequenzy =
                            bucket_map.get(operator).unwrap() / bucket_map.get("sum").unwrap();
                        let frequenzy_rounded = f64::trunc(frequenzy * 100.0) / 100.0;
                        result_builder.push(frequenzy_rounded);
                    }
                    bucket_map.insert(operator, 0.0);

                }
                time_bucket += bucket_size;
            }
        }

        column_index += 1;
    }

    create_rel_freq_bucket(
        &batch,
        column_for_operator,
        result_bucket,
        result_vec_operator,
        result_builder,
    )
}

