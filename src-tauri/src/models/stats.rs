use serde::Serialize;

#[derive(Serialize)]
pub struct ColumnInfo {
  pub name: String,
  pub dtype: String,
  pub notnull: bool,
  pub pk: bool,
}

#[derive(Serialize)]
pub struct TableStats {
  pub name: String,
  pub count: i64,
  pub columns: Vec<ColumnInfo>,
}

#[derive(Serialize)]
pub struct DbInfo {
  pub path: String,
  pub status: String,
  pub version: i32,
  pub tables: Vec<TableStats>,
}
