use crate::db::db_core::get_conn;
use rusqlite::params;

#[tauri::command]
pub fn delete_schedule(id: i64) -> Result<(), String> {
  let conn = get_conn()?;

  conn
    .execute("DELETE FROM schedules WHERE id = ?1", params![id])
    .map_err(|e| format!("delete schedule error: {}", e))?;

  Ok(())
}
