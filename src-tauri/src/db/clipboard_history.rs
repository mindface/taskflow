use crate::db::db_core::get_conn;
use rusqlite::params;
use serde::Serialize;

#[derive(Serialize)]
pub struct ClipboardHistoryEntry {
  pub id: i64,
  pub title: Option<String>,
  pub content: String,
  pub content_type: String,
  pub created_at: String,
}

/// Classifies clipboard content without changing the value that will be stored.
pub fn detect_content_type(content: &str) -> &'static str {
  let trimmed = content.trim_start();

  if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
    "url"
  } else {
    let lowercase = content.to_lowercase();
    if lowercase.contains("select") || lowercase.contains("function") {
      "code"
    } else if content.contains('#') {
      "markdown"
    } else {
      "text"
    }
  }
}

/// Inserts the original clipboard text as-is and returns its generated ID.
pub fn save_clipboard_content(content: &str) -> Result<i64, String> {
  let conn = get_conn()?;
  let content_type = detect_content_type(content);
  println!("Detected clipboard content: {content}");
  println!("Detected clipboard content type: {content_type}");

  conn
    .execute(
      "INSERT INTO clipboard_history (title, content, content_type) VALUES (?1, ?2, ?3)",
      params![Option::<String>::None, content, content_type],
    )
    .map_err(|e| format!("clipboard history insert error: {e}"))?;

  Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn list_clipboard_history() -> Result<Vec<ClipboardHistoryEntry>, String> {
  let conn = get_conn()?;
  let mut statement = conn
    .prepare(
      "SELECT id, title, content, content_type, created_at
       FROM clipboard_history
       ORDER BY id DESC",
    )
    .map_err(|e| format!("clipboard history query prepare error: {e}"))?;

  let entries = statement
    .query_map([], |row| {
      Ok(ClipboardHistoryEntry {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        content_type: row.get(3)?,
        created_at: row.get(4)?,
      })
    })
    .map_err(|e| format!("clipboard history query error: {e}"))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("clipboard history row read error: {e}"))?;

  Ok(entries)
}

#[cfg(test)]
mod tests {
  use super::detect_content_type;

  #[test]
  fn classifies_clipboard_content() {
    assert_eq!(detect_content_type("https://example.com/rust"), "url");
    assert_eq!(detect_content_type("SELECT * FROM users;"), "code");
    assert_eq!(detect_content_type("function greet() {}"), "code");
    assert_eq!(detect_content_type("## Tauri Memo\nbody"), "markdown");
    assert_eq!(detect_content_type("明日の打ち合わせは10時"), "text");
  }
}
