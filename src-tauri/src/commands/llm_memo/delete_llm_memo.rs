use crate::db::db_core::get_conn;
use rusqlite::params;

#[tauri::command]
pub fn delete_llm_memo(id: i64) -> Result<(), String> {
  let conn = get_conn()?;
  conn
    .execute("DELETE FROM llm_memos WHERE id = ?1", params![id])
    .map_err(|e| format!("Delete llm memo error: {}", e))?;

  Ok(())
}
