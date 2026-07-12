use crate::models::note::ShareNote;
use libsql::{Builder, Connection};
use serde_json;

pub fn serialize_links(links: &[String]) -> Result<String, String> {
  serde_json::to_string(links).map_err(|e| format!("Serialize links error: {e}"))
}

pub fn deserialize_links(raw: &str) -> Result<Vec<String>, String> {
  serde_json::from_str(raw).map_err(|e| format!("Deserialize links error: {e}"))
}

pub async fn connect() -> Result<Connection, String> {
  let db = Builder::new_remote(
    std::env::var("TURSO_DATABASE_URL")
      .map_err(|e| format!("Missing TURSO_DATABASE_URL: {e}"))?,
    std::env::var("TURSO_AUTH_TOKEN")
      .map_err(|e| format!("Missing TURSO_AUTH_TOKEN: {e}"))?,
  )
  .build()
  .await
  .map_err(|e| format!("Turso build error: {e}"))?;

  db.connect().map_err(|e| format!("Turso connect error: {e}"))
}

pub async fn create_table(conn: &Connection) -> Result<(), String> {
  conn
    .execute(
      "
      CREATE TABLE IF NOT EXISTS share_notes (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        links TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
      ",
      (),
    )
    .await
    .map_err(|e| format!("Create table error: {e}"))?;

  Ok(())
}

pub async fn insert(conn: &Connection, note: &ShareNote) -> Result<(), String> {
  let links = serialize_links(&note.links)?;

  conn
    .execute(
      "
      INSERT INTO share_notes (id, title, content, links, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      ",
      (
        note.id,
        &note.title,
        &note.content,
        links,
        &note.created_at,
        &note.updated_at,
      ),
    )
    .await
    .map_err(|e| format!("Insert share note error: {e}"))?;

  Ok(())
}

pub async fn list_notes(conn: &Connection) -> Result<Vec<ShareNote>, String> {
  let mut rows = conn
    .query(
      "SELECT id, title, content, links, created_at, updated_at FROM share_notes ORDER BY updated_at DESC",
      (),
    )
    .await
    .map_err(|e| format!("Query share notes error: {e}"))?;

  let mut notes = Vec::new();
  while let Some(row) = rows
    .next()
    .await
    .map_err(|e| format!("Read share note row error: {e}"))?
  {
    let id: i64 = row
      .get(0)
      .map_err(|e| format!("Read share note id error: {e}"))?;
    let title: String = row
      .get(1)
      .map_err(|e| format!("Read share note title error: {e}"))?;
    let content: String = row
      .get(2)
      .map_err(|e| format!("Read share note content error: {e}"))?;
    let links_raw: String = row
      .get(3)
      .map_err(|e| format!("Read share note links error: {e}"))?;
    let created_at: String = row
      .get(4)
      .map_err(|e| format!("Read share note created_at error: {e}"))?;
    let updated_at: String = row
      .get(5)
      .map_err(|e| format!("Read share note updated_at error: {e}"))?;

    notes.push(ShareNote {
      id,
      title,
      content,
      links: deserialize_links(&links_raw)?,
      created_at,
      updated_at,
    });
  }

  Ok(notes)
}

pub async fn get_note(conn: &Connection, id: i64) -> Result<Option<ShareNote>, String> {
  let mut rows = conn
    .query(
      "SELECT id, title, content, links, created_at, updated_at FROM share_notes WHERE id = ?1",
      (id,),
    )
    .await
    .map_err(|e| format!("Get share note error: {e}"))?;

  if let Some(row) = rows
    .next()
    .await
    .map_err(|e| format!("Read share note row error: {e}"))?
  {
    let id: i64 = row
      .get(0)
      .map_err(|e| format!("Read share note id error: {e}"))?;
    let title: String = row
      .get(1)
      .map_err(|e| format!("Read share note title error: {e}"))?;
    let content: String = row
      .get(2)
      .map_err(|e| format!("Read share note content error: {e}"))?;
    let links_raw: String = row
      .get(3)
      .map_err(|e| format!("Read share note links error: {e}"))?;
    let created_at: String = row
      .get(4)
      .map_err(|e| format!("Read share note created_at error: {e}"))?;
    let updated_at: String = row
      .get(5)
      .map_err(|e| format!("Read share note updated_at error: {e}"))?;

    Ok(Some(ShareNote {
      id,
      title,
      content,
      links: deserialize_links(&links_raw)?,
      created_at,
      updated_at,
    }))
  } else {
    Ok(None)
  }
}

pub async fn update_note(conn: &Connection, note: &ShareNote) -> Result<(), String> {
  let links = serialize_links(&note.links)?;

  conn
    .execute(
      "
      UPDATE share_notes
      SET title = ?2, content = ?3, links = ?4, created_at = ?5, updated_at = ?6
      WHERE id = ?1
      ",
      (
        note.id,
        &note.title,
        &note.content,
        links,
        &note.created_at,
        &note.updated_at,
      ),
    )
    .await
    .map_err(|e| format!("Update share note error: {e}"))?;

  Ok(())
}

pub async fn delete_note(conn: &Connection, id: i64) -> Result<(), String> {
  conn
    .execute("DELETE FROM share_notes WHERE id = ?1", (id,))
    .await
    .map_err(|e| format!("Delete share note error: {e}"))?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn serialize_and_deserialize_links_roundtrip() {
    let links = vec!["https://example.com".to_string(), "https://example.org".to_string()];
    let serialized = serialize_links(&links).unwrap();
    let deserialized = deserialize_links(&serialized).unwrap();

    assert_eq!(deserialized, links);
  }

  #[test]
  fn share_note_can_be_created_from_row_data() {
    let note = ShareNote {
      id: 42,
      title: "hello".to_string(),
      content: "world".to_string(),
      links: vec!["https://example.com".to_string()],
      created_at: "2024-01-01T00:00:00Z".to_string(),
      updated_at: "2024-01-01T00:00:00Z".to_string(),
    };

    let serialized = serialize_links(&note.links).unwrap();
    let rebuilt = ShareNote {
      id: note.id,
      title: note.title.clone(),
      content: note.content.clone(),
      links: deserialize_links(&serialized).unwrap(),
      created_at: note.created_at.clone(),
      updated_at: note.updated_at.clone(),
    };

    assert_eq!(rebuilt.id, note.id);
    assert_eq!(rebuilt.links, note.links);
  }
}
