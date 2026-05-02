use crate::db::db_core::get_conn;
use chrono::Utc;
use rusqlite::params;

#[tauri::command]
pub fn update_llm_memo(
  id: i64,
  title: String,
  content: String,
  tag: String,
  role: String,
) -> Result<(), String> {
  let conn = get_conn()?;
  let now = Utc::now().to_rfc3339();
  conn
    .execute(
      "
      UPDATE llm_memos
      SET title = ?1, content = ?2, updated_at = ?3, tag = ?4, role = ?5
      WHERE id = ?6
      ",
      params![title, content, now, tag, role, id],
    )
    .map_err(|e| format!("Update llm memo error: {}", e))?;

  Ok(())
}
