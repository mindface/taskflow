use crate::commands::db_core::get_conn;
use rusqlite::params;

#[tauri::command]
pub fn add_concept_process_factor(
  name: String,
  description: Option<String>,
) -> Result<i64, String> {
  let conn = get_conn()?;

  conn
    .execute(
      "INSERT INTO concept_process_factors (name, description) VALUES (?1, ?2)",
      params![name, description],
    )
    .map_err(|e| format!("Insert process factor error: {}", e))?;

  Ok(conn.last_insert_rowid())
}
