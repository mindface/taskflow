use crate::commands::db_core::get_conn;
use crate::models::note::{ConceptRelationView, ConceptView, Note, NoteDetail};
use chrono::Utc;
use rusqlite::{params, Connection};

#[tauri::command]
pub fn init_db() -> Result<String, String> {
  let conn = get_conn()?;
  conn
    .execute_batch(
      "BEGIN;
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            infolink TEXT,
            tag TEXT NOT NULL
            -- created_at/updated_at handled by migration
        );

        CREATE TABLE IF NOT EXISTS concept_process_factors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            infolink TEXT
            -- created_at/updated_at handled by migration
        );

        CREATE TABLE IF NOT EXISTS concept_relations (
            from_concept_id INTEGER NOT NULL,
            to_concept_id INTEGER NOT NULL,
            relation_type TEXT NOT NULL,
            PRIMARY KEY (from_concept_id, to_concept_id, relation_type)
        );

        CREATE TABLE IF NOT EXISTS note_concepts (
            note_id INTEGER NOT NULL,
            concept_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            PRIMARY KEY (note_id, concept_id, role)
        );

        COMMIT;",
    )
    .map_err(|e| format!("DB init error: {}", e))?;
  Ok("initialized".into())
}

#[tauri::command]
pub fn add_note(title: String, content: String) -> Result<i64, String> {
  let conn = get_conn()?;
  let now = Utc::now().to_rfc3339();
  conn
    .execute(
      "INSERT INTO notes (title, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
      params![title, content, now, now],
    )
    .map_err(|e| format!("Insert error: {}", e))?;
  Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn list_notes() -> Result<Vec<Note>, String> {
  let conn = get_conn()?;
  let mut stmt = conn
    .prepare(
      "SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC",
    )
    .map_err(|e| format!("Prepare error: {}", e))?;
  let rows = stmt
    .query_map([], |row| {
      Ok(Note {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
      })
    })
    .map_err(|e| format!("QueryMap error: {}", e))?;

  let mut notes = Vec::new();
  for r in rows {
    notes.push(r.map_err(|e| format!("Row read error: {}", e))?);
  }
  Ok(notes)
}

#[tauri::command]
pub fn get_note(id: i64) -> Result<Note, String> {
  let conn = get_conn()?;
  conn
    .query_row(
      "SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?1",
      params![id],
      |row| {
        Ok(Note {
          id: row.get(0)?,
          title: row.get(1)?,
          content: row.get(2)?,
          created_at: row.get(3)?,
          updated_at: row.get(4)?,
        })
      },
    )
    .map_err(|e| format!("Query error: {}", e))
}

#[tauri::command]
pub fn update_note(id: i64, title: String, content: String) -> Result<(), String> {
  let conn = get_conn()?;
  let now = Utc::now().to_rfc3339();
  conn
    .execute(
      "UPDATE notes SET title = ?1, content = ?2, updated_at = ?3 WHERE id = ?4",
      params![title, content, now, id],
    )
    .map_err(|e| format!("Update error: {}", e))?;
  Ok(())
}

#[tauri::command]
pub fn delete_note(id: i64) -> Result<(), String> {
  let conn = get_conn()?;
  conn
    .execute("DELETE FROM notes WHERE id = ?1", params![id])
    .map_err(|e| format!("Delete error: {}", e))?;
  Ok(())
}

#[tauri::command]
pub fn get_note_detail(note_id: i64) -> Result<NoteDetail, String> {
  let conn = get_conn()?;

  // 1. Note 本体
  let note = conn
    .query_row(
      "SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?1",
      params![note_id],
      |row| {
        Ok(Note {
          id: row.get(0)?,
          title: row.get(1)?,
          content: row.get(2)?,
          created_at: row.get(3)?,
          updated_at: row.get(4)?,
        })
      },
    )
    .map_err(|e| format!("Query note error: {}", e))?;

  // 2. ConceptView 一覧
  let mut stmt = conn
    .prepare(
      "
            SELECT
                c.id,
                c.name,
                c.description,
                c.tag,
                c.infolink,
                c.created_at,
                c.updated_at,
                nc.role
            FROM concepts c
            JOIN note_concepts nc ON c.id = nc.concept_id
            WHERE nc.note_id = ?1
            ",
    )
    .map_err(|e| format!("Prepare concepts error: {}", e))?;

  let concept_rows = stmt
    .query_map(params![note_id], |row| {
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
    .map_err(|e| format!("QueryMap concepts error: {}", e))?;

  let mut concepts = Vec::new();
  for r in concept_rows {
    concepts.push(r.map_err(|e| format!("Row read concept error: {}", e))?);
  }

  // 3. ConceptRelation 一覧（note に紐づく concept 同士）
  let mut stmt = conn
    .prepare(
      "
            SELECT
                cr.from_concept_id,
                cr.to_concept_id,
                cr.relation_type
            FROM concept_relations cr
            WHERE
                cr.from_concept_id IN (
                    SELECT concept_id FROM note_concepts WHERE note_id = ?1
                )
                AND
                cr.to_concept_id IN (
                    SELECT concept_id FROM note_concepts WHERE note_id = ?1
                )
            ",
    )
    .map_err(|e| format!("Prepare relations error: {}", e))?;

  let relation_rows = stmt
    .query_map(params![note_id], |row| {
      Ok(ConceptRelationView {
        from_concept_id: row.get(0)?,
        to_concept_id: row.get(1)?,
        relation_type: row.get(2)?,
      })
    })
    .map_err(|e| format!("QueryMap relations error: {}", e))?;

  let mut relations = Vec::new();
  for r in relation_rows {
    relations.push(r.map_err(|e| format!("Row read relation error: {}", e))?);
  }

  Ok(NoteDetail {
    note,
    concepts,
    relations,
  })
}

fn ensure_column(
  conn: &Connection,
  table: &str,
  column: &str,
  column_def: &str,
) -> Result<(), String> {
  // PRAGMA table_info('<table>') でカラム一覧を取得
  let mut stmt = conn
    .prepare(&format!("PRAGMA table_info('{}')", table))
    .map_err(|e| format!("prepare pragma error: {}", e))?;

  let mut exists = false;
  let rows = stmt
    .query_map([], |row| row.get::<usize, String>(1))
    .map_err(|e| format!("query_map pragma error: {}", e))?;
  for r in rows {
    if let Ok(name) = r {
      if name == column {
        exists = true;
        break;
      }
    }
  }

  if exists {
    return Ok(());
  }

  // カラムがなければ追加（宣言は column_def、例: "TEXT"）
  conn
    .execute(
      &format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, column_def),
      [],
    )
    .map_err(|e| format!("ALTER TABLE add column error: {}", e))?;

  Ok(())
}

#[tauri::command]
pub fn run_migrations() -> Result<String, String> {
  let conn = get_conn()?;
  // ここに必要なカラムを列挙
  ensure_column(&conn, "concepts", "infolink", "TEXT")?;
  ensure_column(&conn, "concept_process_factors", "infolink", "TEXT")?;
  // 将来的な追加カラム・インデックスはここに追記
  Ok("migrations applied".into())
}
