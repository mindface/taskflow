use crate::db::db_core::get_conn;
use chrono::Utc;
use rusqlite::params;

#[tauri::command]
pub fn add_llm_memo(
  title: String,
  content: String,
  tag: String,
  role: String,
) -> Result<i64, String> {
  let conn = get_conn()?;
  let now = Utc::now().to_rfc3339();
  conn
    .execute(
      "
      INSERT INTO llm_memos (title, content, created_at, updated_at, tag, role)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      ",
      params![title, content, now, now, tag, role],
    )
    .map_err(|e| format!("Insert llm memo error: {}", e))?;

  Ok(conn.last_insert_rowid())
}
