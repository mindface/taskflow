use crate::commands::db_core::get_conn;
use crate::models::note::ConceptView;
use rusqlite::{params_from_iter, ToSql};

#[tauri::command]
pub fn search_note_concepts(
  name: Option<String>,
  note_id: i64,
  tag: Option<String>,
  role: Option<String>,
  keyword: Option<String>,
) -> Result<Vec<ConceptView>, String> {
  let conn = get_conn()?;

  let mut sql = String::from(
    "
    SELECT
      c.id,
      c.name,
      c.description,
      c.tag,
      c.infolink,
      c.created_at,
      c.updated_at,
      nc.role,
      n.id,
      n.title
    FROM concepts c
    LEFT JOIN note_concepts nc ON c.id = nc.concept_id
    LEFT JOIN notes n ON nc.note_id = n.id
    WHERE nc.note_id = ?
    ",
  );

  // params を順番に積む
  let mut params: Vec<Box<dyn ToSql>> = Vec::new();
  params.push(Box::new(note_id));

  // name フィルタ
  if let Some(name) = name.as_ref() {
    println!("Is = {}", name.clone());
    sql.push_str(" AND c.name LIKE ?");
    let likefilter = format!("%{}%", name.clone());
    params.push(Box::new(likefilter));
  }

  // tag フィルタ
  if let Some(tag) = tag {
    sql.push_str(" AND c.tag = ?");
    params.push(Box::new(tag));
  }

  // role フィルタ
  if let Some(role) = role {
    sql.push_str(" AND nc.role = ?");
    params.push(Box::new(role));
  }

  // keyword 検索（name / description）
  if let Some(keyword) = keyword {
    sql.push_str(" AND (c.name LIKE ? OR c.description LIKE ?)");
    let like = format!("%{}%", keyword);
    params.push(Box::new(like.clone()));
    params.push(Box::new(like));
  }

  sql.push_str(" ORDER BY c.updated_at DESC");

  let mut stmt = conn
    .prepare(&sql)
    .map_err(|e| format!("Prepare error: {}", e))?;

  let rows = stmt
    .query_map(params_from_iter(params.iter()), |row| {
      Ok(ConceptView {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        tag: row.get(3)?,
        infolink: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
        role: row.get::<_, Option<String>>(7)?,
        note_id: row.get::<_, Option<i64>>(8)?,
        note_title: row.get::<_, Option<String>>(9)?,
      })
    })
    .map_err(|e| format!("QueryMap error: {}", e))?;

  let mut concepts = Vec::new();
  for r in rows {
    concepts.push(r.map_err(|e| format!("Row read error: {}", e))?);
  }

  Ok(concepts)
}
