use crate::db::db_core::get_conn;
use crate::models::llmMemo::LlmMemo;
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

#[tauri::command]
pub fn list_llm_memos() -> Result<Vec<LlmMemo>, String> {
  let conn = get_conn()?;
  let mut stmt = conn
    .prepare(
      "
      SELECT id, title, content, created_at, updated_at, tag, role
      FROM llm_memos
      ORDER BY updated_at DESC
      ",
    )
    .map_err(|e| format!("Prepare llm memo list error: {}", e))?;

  let rows = stmt
    .query_map([], |row| {
      Ok(LlmMemo {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        tag: row.get(5)?,
        role: row.get(6)?,
      })
    })
    .map_err(|e| format!("QueryMap llm memo list error: {}", e))?;

  let mut memos = Vec::new();
  for row in rows {
    memos.push(row.map_err(|e| format!("Read llm memo row error: {}", e))?);
  }

  Ok(memos)
}

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

#[tauri::command]
pub fn delete_llm_memo(id: i64) -> Result<(), String> {
  let conn = get_conn()?;
  conn
    .execute("DELETE FROM llm_memos WHERE id = ?1", params![id])
    .map_err(|e| format!("Delete llm memo error: {}", e))?;

  Ok(())
}
