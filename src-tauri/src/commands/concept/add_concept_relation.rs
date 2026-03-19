use crate::commands::db_core::get_conn;
use rusqlite::params;

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
