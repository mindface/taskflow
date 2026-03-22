use crate::db::db_core::get_conn;
use crate::models::note::ConceptView;

#[tauri::command]
pub fn list_concepts() -> Result<Vec<ConceptView>, String> {
  let conn = get_conn()?;
  let mut stmt = conn
    .prepare(
      "SELECT
      c.id,
      c.name,
      c.description,
      c.tag,
      c.infolink,
      c.created_at,
      c.updated_at,
      c.role,
      n.id,
      n.title
      FROM concepts c
      LEFT JOIN note_concepts nc ON c.id = nc.concept_id
      LEFT JOIN notes n ON nc.note_id = n.id
      ORDER BY c.updated_at DESC
    ",
    )
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
        note_id: row.get(8)?,
        note_title: row.get(9)?,
      })
    })
    .map_err(|e| format!("QueryMap error: {}", e))?;

  let mut notes = Vec::new();
  for r in rows {
    notes.push(r.map_err(|e| format!("Row read error: {}", e))?);
  }
  Ok(notes)
}
