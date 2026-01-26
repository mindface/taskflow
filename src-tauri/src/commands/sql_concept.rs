use crate::commands::db_core::get_conn;
use crate::models::note::{ConceptView};
use rusqlite::{params};

#[tauri::command]
pub fn add_concept(name: String, description: Option<String>, tag: String) -> Result<i64, String> {
  let conn = get_conn()?;

  conn
    .execute(
      "INSERT INTO concepts (name, description, tag) VALUES (?1, ?2, ?3)",
      params![name, description, tag],
    )
    .map_err(|e| format!("Insert concept error: {}", e))?;

  Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn add_concept_process_factor(
  name: String,
  description: Option<String>,
) -> Result<i64, String> {
  let conn = get_conn()?;

  conn
    .execute(
      "INSERT INTO concept_process_factors (name, description) VALUES (?1, ?2)",
      params![name, description],
    )
    .map_err(|e| format!("Insert process factor error: {}", e))?;

  Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn add_concept_relation(
  from_concept_id: i64,
  to_concept_id: i64,
  relation_type: String,
) -> Result<(), String> {
  let conn = get_conn()?;

  conn
    .execute(
      "
        INSERT OR IGNORE INTO concept_relations
        (from_concept_id, to_concept_id, relation_type)
        VALUES (?1, ?2, ?3)
        ",
      params![from_concept_id, to_concept_id, relation_type],
    )
    .map_err(|e| format!("Insert concept relation error: {}", e))?;

  Ok(())
}

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

#[tauri::command]
pub fn add_note_concept(note_id: i64, concept_id: i64, role: String) -> Result<(), String> {
  let conn = get_conn()?;

  conn
    .execute(
      "
        INSERT OR IGNORE INTO note_concepts
        (note_id, concept_id, role)
        VALUES (?1, ?2, ?3)
        ",
      params![note_id, concept_id, role],
    )
    .map_err(|e| format!("Insert note concept error: {}", e))?;

  Ok(())
}

#[tauri::command]
pub fn list_concepts() -> Result<Vec<ConceptView>, String> {
  let conn = get_conn()?;
  let mut stmt = conn.prepare("SELECT id, name, description, tag, infolink, created_at, updated_at, role FROM concepts ORDER BY updated_at DESC")
        .map_err(|e| format!("Prepare error: {}", e))?;
  let rows = stmt
    .query_map([], |row| {
      Ok(ConceptView {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        tag: row.get(3)?,
        infolink: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
        role: row.get::<_, Option<String>>(7)?,
      })
    })
    .map_err(|e| format!("QueryMap error: {}", e))?;

  let mut notes = Vec::new();
  for r in rows {
    notes.push(r.map_err(|e| format!("Row read error: {}", e))?);
  }
  Ok(notes)
}
