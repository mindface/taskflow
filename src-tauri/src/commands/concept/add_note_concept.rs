use crate::db::db_core::get_conn;
use rusqlite::params;

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
