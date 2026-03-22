use crate::db::db_core::get_conn;
use rusqlite::params;

#[tauri::command]
pub fn add_concept_to_note(
  note_id: i64,
  name: String,
  tag: String,
  description: Option<String>,
  infolink: Option<String>,
  role: String,
) -> Result<(), String> {
  let mut conn = get_conn()?;
  let tx = conn.transaction().map_err(|e| e.to_string())?;

  // 1. concept を作成（すでにあれば無視）
  tx.execute(
    "
    INSERT OR IGNORE INTO concepts (name, tag, description, infolink)
    VALUES (?1, ?2, ?3, ?4)
    ",
    params![name, tag, description, infolink],
  )
  .map_err(|e| format!("Insert concept error: {}", e))?;

  // 2. concept_id を取得（新規 or 既存）
  let concept_id: i64 = tx
    .query_row(
      "SELECT id FROM concepts WHERE name = ?1",
      params![name],
      |row| row.get(0),
    )
    .map_err(|e| format!("Select concept id error: {}", e))?;

  // 3. note と紐づけ
  tx.execute(
    "
    INSERT OR IGNORE INTO note_concepts
    (note_id, concept_id, role)
    VALUES (?1, ?2, ?3)
    ",
    params![note_id, concept_id, role],
  )
  .map_err(|e| format!("Insert note_concept error: {}", e))?;

  tx.commit().map_err(|e| e.to_string())?;
  Ok(())
}
