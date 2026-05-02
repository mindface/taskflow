use crate::db::db_core::get_conn;
use crate::models::llmMemo::LlmMemo;
use rusqlite::params;

#[tauri::command]
pub fn get_llm_memo(id: i64) -> Result<LlmMemo, String> {
  let conn = get_conn()?;
  conn
    .query_row(
      "
      SELECT id, title, content, created_at, updated_at, tag, role
      FROM llm_memos
      WHERE id = ?1
      ",
      params![id],
      |row| {
        Ok(LlmMemo {
          id: row.get(0)?,
          title: row.get(1)?,
          content: row.get(2)?,
          created_at: row.get(3)?,
          updated_at: row.get(4)?,
          tag: row.get(5)?,
          role: row.get(6)?,
        })
      },
    )
    .map_err(|e| format!("Get llm memo error: {}", e))
}
