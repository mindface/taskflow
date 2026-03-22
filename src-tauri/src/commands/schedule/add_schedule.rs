use crate::db::db_core::get_conn;

use chrono::Utc;
use rusqlite::params;

#[tauri::command]
pub fn add_schedule(title: String, description: Option<String>) -> Result<i64, String> {
  let conn = get_conn()?;

  let now = Utc::now().to_rfc3339();

  conn
    .execute(
      "
      INSERT INTO schedules
      (title, description, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4)
      ",
      params![title, description, now, now],
    )
    .map_err(|e| format!("insert schedule error: {}", e))?;

  Ok(conn.last_insert_rowid())
}
