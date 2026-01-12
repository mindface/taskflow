use crate::commands::db_core::get_conn;
use crate::models::note::Note;
use csv::{Reader, Writer};
use genpdf::{elements, fonts, Document};
use rusqlite::params;
use std::fs;
use std::io::{self};
use std::path::{Path, PathBuf};

#[tauri::command]
pub fn list_files(directory: Option<String>) -> Result<Vec<String>, String> {
  let dir_path = directory
    .map(PathBuf::from)
    .unwrap_or_else(|| PathBuf::from("."));

  println!("Reading directory: {:?}", dir_path);

  let entries = fs::read_dir(&dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;

  let files: Vec<String> = entries
    .filter_map(|entry| entry.ok())
    .filter(|entry| entry.path().is_file())
    .filter_map(|entry| {
      let file_name = entry.file_name().into_string().ok()?;
      if file_name == "CACHEDIR.TAG" || file_name.starts_with('.') {
        None
      } else {
        Some(file_name)
      }
    })
    .collect();

  Ok(files)
}

#[tauri::command]
pub fn reading_file(file_path: String) -> Result<String, String> {
  println!("Reading file: {:?}", file_path);
  fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn writing_file(directory: String, file_name: String, content: String) -> Result<(), String> {
  let path = Path::new(&directory).join(&file_name);
  fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn add_file(directory: String, file_name: String, content: String) -> Result<String, String> {
  let path = Path::new(&directory).join(file_name);
  // let path = Path::new("target").join(file_name);

  fs::write(&path, content).map_err(|e| format!("Failed to write to file: {}", e))?;

  Ok("File has been successfully added!".to_string())
}

#[tauri::command]
pub fn deleteing_file(file_name: String) -> Result<String, String> {
  let path = Path::new("target").join(&file_name);

  if !path.exists() {
    return Err(format!("File '{}' does not exist.", file_name));
  }

  fs::remove_file(&path).map_err(|e: io::Error| format!("Failed to delete file: {}", e))?;

  Ok(format!(
    "File '{}' has been successfully deleted!",
    file_name
  ))
}

#[tauri::command]
pub fn export_pdf(output_path: String, text: String) -> Result<(), String> {
  let font_family =
    fonts::from_files("fonts", "LiberationSans", None).map_err(|e| e.to_string())?;

  let mut doc = Document::new(font_family);
  doc.set_title("Generated PDF");
  doc.push(elements::Paragraph::new(text));

  doc.render_to_file(output_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_notes(csv_path: String) -> Result<(), String> {
  let conn = get_conn()?;

  let mut stmt = conn
    .prepare(
      "SELECT id, title, content, created_at, updated_at
         FROM notes
         ORDER BY created_at ASC",
    )
    .map_err(|e| e.to_string())?;

  let notes_iter = stmt
    .query_map([], |row| {
      Ok(Note {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
      })
    })
    .map_err(|e| e.to_string())?;

  let mut wtr = Writer::from_path(&csv_path).map_err(|e| e.to_string())?;

  wtr
    .write_record(&["id", "title", "content", "created_at", "updated_at"])
    .map_err(|e| e.to_string())?;

  for note in notes_iter {
    let n = note.map_err(|e| e.to_string())?;
    wtr
      .write_record(&[
        n.id.to_string(),
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
      ])
      .map_err(|e| e.to_string())?;
  }

  wtr.flush().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_notes(csv_path: String) -> Result<(), String> {
  let mut conn = get_conn()?;
  let tx = conn.transaction().map_err(|e| e.to_string())?;

  let mut rdr = Reader::from_path(csv_path).map_err(|e| e.to_string())?;

  for result in rdr.deserialize::<Note>() {
    let note = result.map_err(|e| e.to_string())?;

    // バリデーション
    if note.title.trim().is_empty() {
      return Err("title is empty".into());
    }

    tx.execute(
      "
            INSERT INTO notes (
                id, title, content, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                content = excluded.content,
                updated_at = excluded.updated_at
            ",
      params![
        note.id,
        note.title,
        note.content,
        note.created_at,
        note.updated_at
      ],
    )
    .map_err(|e| e.to_string())?;
  }

  tx.commit().map_err(|e| e.to_string())
}
