use crate::db::db_core::get_conn;
use crate::models::llm_memo::LlmMemo;

#[tauri::command]
pub fn list_llm_memo() -> Result<Vec<LlmMemo>, String> {
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
