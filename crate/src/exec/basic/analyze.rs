use arrow::{array::{Array, ArrayRef, BooleanArray, Float64Array, StringArray}, compute::{take, sort_to_indices}, datatypes::{Field, Schema}, record_batch::RecordBatch};
use std::{
    collections::{HashSet},
    sync::Arc,
};
use arrow::error::Result as ArrowResult;

use crate::{utils::{print_to_cons::print_to_js_with_obj, record_batch_util::create_record_batch}};


fn flatten<T>(nested: Vec<Vec<T>>) -> Vec<T> {
    nested.into_iter().flatten().collect()
}

pub fn concat_record_batches(vec_batch: Vec<RecordBatch>) -> RecordBatch {

    let mut vec_fields = Vec::new();
    let mut vec_columns = Vec::new();

    for batch in vec_batch {
        vec_fields.push(batch.schema().fields().to_owned());
        vec_columns.push(batch.columns().to_owned());
    }

    let fields = flatten::<Field>(vec_fields);
    let columns = flatten::<Arc<dyn Array>>(vec_columns);

    let schema = Schema::new(fields);
    let batch = RecordBatch::try_new(Arc::new(schema), columns);
   
    batch.unwrap()

}


pub fn select_columns(batch: RecordBatch, column_index: Vec<usize>) -> RecordBatch {
    let mut vec = Vec::new();

    for index in &column_index {
        let array = batch.column(*index).to_owned();

        vec.push(array);
    }

    let mut fields = Vec::new();
    let old_schema = batch.schema();

    for index in &column_index {
        fields.push(old_schema.field(*index).to_owned());
    }

    let new_schema = Schema::new(fields);

    create_record_batch(Arc::new(new_schema), vec)
}

pub fn filter_between(column_num: usize, filter_from: f64, filter_to: f64, batch: &RecordBatch) -> RecordBatch {

    print_to_js_with_obj(&format!("{:?}", filter_from).into());
    print_to_js_with_obj(&format!("{:?}", filter_from  < 0.0).into());


    if filter_from < 0.0 && filter_to < 0.0 {
        print_to_js_with_obj(&format!("{:?}", "No filter").into());

        return batch.to_owned();
    }

    let filter_array = batch
        .column(column_num)
        .as_any()
        .downcast_ref::<Float64Array>()
        .unwrap()
        .iter()
        .map(|value| Some(value.unwrap() >= filter_from && value.unwrap() <= filter_to))
        .collect::<BooleanArray>();

    let mut arrays: Vec<ArrayRef> = Vec::new();

    for idx in 0..batch.num_columns() {
        let array = batch.column(idx).as_ref();

        let filtered = arrow::compute::filter(array, &filter_array).unwrap();

        arrays.push(filtered);
    }

    create_record_batch(batch.schema(), arrays)
}


pub fn filter_with(column_num: usize, filter_strs: Vec<&str>, batch: &RecordBatch) -> RecordBatch {
    if filter_strs.len() == 1 && filter_strs[0] == "All" {
        return batch.to_owned();
    }
    let filter_array = batch
        .column(column_num)
        .as_any()
        .downcast_ref::<StringArray>()
        .unwrap()
        .iter()
        .map(|value| Some(filter_strs.contains(&value.unwrap())))
        .collect::<BooleanArray>();

    let mut arrays: Vec<ArrayRef> = Vec::new();

    for idx in 0..batch.num_columns() {
        let array = batch.column(idx).as_ref();

        let filtered = arrow::compute::filter(array, &filter_array).unwrap();

        arrays.push(filtered);
    }

    create_record_batch(batch.schema(), arrays)
}
 
pub fn sort_batch(batch: &RecordBatch, column_index_to_sort: usize) -> RecordBatch {

    let options = arrow::compute::SortOptions{
        descending: false,
        nulls_first: false,
    };

    let indices = sort_to_indices(batch.column(column_index_to_sort), Some(options), None).unwrap();

    RecordBatch::try_new(
        batch.schema(),batch
            .columns()
            .iter()
            .map(|column| take(column.as_ref(), &indices, None))
            .collect::<ArrowResult<Vec<ArrayRef>>>().unwrap(),
    ).unwrap()
    
}

pub fn find_unique_string(batch: &RecordBatch, column_index_for_unqiue: usize) -> RecordBatch {
    let vec = batch
        .column(column_index_for_unqiue)
        .as_any()
        .downcast_ref::<StringArray>()
        .unwrap();

    let hash_set = vec
        .into_iter()
        .map(|item| item.unwrap())
        .collect::<HashSet<&str>>()
        .into_iter()
        .collect::<Vec<&str>>();

    let array = StringArray::from(hash_set);

    let schema = batch.schema();

    let field = schema.field(column_index_for_unqiue);

    let new_schema = Schema::new(vec![field.to_owned()]);

    let batch = RecordBatch::try_new(Arc::new(new_schema), vec![Arc::new(array)]).unwrap();
    return batch;
}

pub fn count_unique_string(batch: &RecordBatch, column_index_for_unqiue: usize) -> RecordBatch {
    let vec = batch
        .column(column_index_for_unqiue)
        .as_any()
        .downcast_ref::<StringArray>()
        .unwrap();

    let hash_set = vec
        .into_iter()
        .map(|item| item.unwrap())
        .collect::<HashSet<&str>>()
        .into_iter()
        .collect::<Vec<&str>>();

    let array = StringArray::from(hash_set);

    let schema = batch.schema();

    let field = schema.field(column_index_for_unqiue);

    let new_schema = Schema::new(vec![field.to_owned()]);

    let batch = RecordBatch::try_new(Arc::new(new_schema), vec![Arc::new(array)]).unwrap();
    return batch;
}

