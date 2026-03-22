use crate::db::db_core::get_conn;

use chrono::Utc;
use rusqlite::params;

#[tauri::command]
pub fn update_schedule(id: i64, title: String, description: Option<String>) -> Result<(), String> {
  let conn = get_conn()?;
  let now = Utc::now().to_rfc3339();

  conn
    .execute(
      "
      UPDATE schedules
      SET title = ?1,
          description = ?2,
          updated_at = ?3
      WHERE id = ?4
      ",
      params![title, description, now, id],
    )
    .map_err(|e| format!("update schedule error: {}", e))?;

  Ok(())
}
