use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::fs;
use std::env;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use crate::commands::models::Note;

fn db_path() -> PathBuf {
    // 1) 環境変数で指定があればそれを優先
    if let Ok(p) = env::var("TASKFLOW_DB_PATH") {
        return PathBuf::from(p);
    }

    // 2) 開発ビルド（debug）ならプロジェクト内 data/notes-dev.db を使う
    if cfg!(debug_assertions) {
        let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        p.push("data");
        let _ = fs::create_dir_all(&p);
        p.push("notes-dev.db");
        return p;
    }

    // 3) 本番（release）ではユーザーのホーム配下に .taskflow/notes.db を作る
    let home = env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let mut p = PathBuf::from(home);
    p.push(".taskflow");
    let _ = fs::create_dir_all(&p);
    p.push("notes.db");
    p
}

fn get_conn() -> Result<Connection, String> {
    let path = db_path();
    Connection::open(path).map_err(|e| format!("DB open error: {}", e))
}

#[tauri::command]
pub fn init_db() -> Result<String, String> {
    let conn = get_conn()?;
    conn.execute_batch(
        "BEGIN;
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        COMMIT;",
    ).map_err(|e| format!("DB init error: {}", e))?;
    Ok("initialized".into())
}

#[tauri::command]
pub fn add_note(title: String, content: String) -> Result<i64, String> {
    let conn = get_conn()?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO notes (title, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![title, content, now, now],
    ).map_err(|e| format!("Insert error: {}", e))?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn list_notes() -> Result<Vec<Note>, String> {
    let conn = get_conn()?;
    let mut stmt = conn.prepare("SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC")
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
    conn.query_row(
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
    ).map_err(|e| format!("Query error: {}", e))
}

#[tauri::command]
pub fn update_note(id: i64, title: String, content: String) -> Result<(), String> {
    let conn = get_conn()?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE notes SET title = ?1, content = ?2, updated_at = ?3 WHERE id = ?4",
        params![title, content, now, id],
    ).map_err(|e| format!("Update error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn delete_note(id: i64) -> Result<(), String> {
    let conn = get_conn()?;
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|e| format!("Delete error: {}", e))?;
    Ok(())
}
// ...existing code...