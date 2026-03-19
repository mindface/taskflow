use crate::commands::db_core::get_conn;
use rusqlite::params;

#[tauri::command]
pub fn add_concept(name: String, description: Option<String>, tag: String) -> Result<i64, String> {
  let conn = get_conn()?;

  conn
    .execute(
      "INSERT INTO concepts (name, description, tag) VALUES (?1, ?2, ?3)",
      params![name, description, tag],
    )
    .map_err(|e| format!("Insert concept error: {}", e))?;

  Ok(conn.last_insert_rowid())
}
