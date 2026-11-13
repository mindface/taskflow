use crate::db::db_core::get_conn;
use crate::models::note::Note;
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use csv::{Reader, Writer};
use genpdf::{elements, fonts, Document};
use rusqlite::params;
use serde::Serialize;
use std::fs;
use std::io::{self, Read};
use std::path::{Component, Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

const DATA_FILE_PREVIEW_LIMIT: usize = 256 * 1024;
const MOLECULE_FILE_LIMIT: u64 = 64 * 1024 * 1024;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredDataFile {
  stored_name: String,
  file_name: String,
  size_bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataFilePreview {
  text: Option<String>,
  is_binary: bool,
  is_truncated: bool,
}

fn uploaded_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
  let directory = app
    .path()
    .app_data_dir()
    .map_err(|e| e.to_string())?
    .join("uploaded-data");
  fs::create_dir_all(&directory).map_err(|e| format!("Failed to create data directory: {e}"))?;
  Ok(directory)
}

fn validate_stored_data_file_name(file_name: &str) -> Result<(), String> {
  let mut components = Path::new(file_name).components();
  if !matches!(components.next(), Some(Component::Normal(_))) || components.next().is_some() {
    return Err("Invalid stored file name".to_string());
  }
  Ok(())
}

#[tauri::command]
pub fn store_uploaded_data_file(
  app: AppHandle,
  source_path: String,
) -> Result<StoredDataFile, String> {
  let source = PathBuf::from(source_path);
  let metadata = fs::metadata(&source).map_err(|e| format!("Failed to read selected file: {e}"))?;
  if !metadata.is_file() {
    return Err("Selected path is not a file".to_string());
  }

  let file_name = source
    .file_name()
    .and_then(|name| name.to_str())
    .filter(|name| !name.is_empty())
    .ok_or_else(|| "Selected file has an invalid name".to_string())?
    .to_string();
  let safe_file_name: String = file_name
    .chars()
    .map(|character| {
      if character.is_alphanumeric() || matches!(character, '.' | '-' | '_') {
        character
      } else {
        '_'
      }
    })
    .collect();
  let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map_err(|e| format!("System clock error: {e}"))?
    .as_nanos();
  let stored_name = format!("{}-{}-{}", std::process::id(), timestamp, safe_file_name);
  let destination = uploaded_data_dir(&app)?.join(&stored_name);
  fs::copy(&source, &destination).map_err(|e| format!("Failed to copy selected file: {e}"))?;
  let size_bytes = fs::metadata(&destination)
    .map_err(|e| format!("Failed to inspect copied file: {e}"))?
    .len();

  Ok(StoredDataFile {
    stored_name,
    file_name,
    size_bytes,
  })
}

#[tauri::command]
pub fn read_uploaded_data_file_preview(
  app: AppHandle,
  stored_name: String,
) -> Result<DataFilePreview, String> {
  validate_stored_data_file_name(&stored_name)?;
  let path = uploaded_data_dir(&app)?.join(stored_name);
  let file = fs::File::open(path).map_err(|e| format!("Failed to open uploaded file: {e}"))?;
  let mut bytes = Vec::new();
  file
    .take((DATA_FILE_PREVIEW_LIMIT + 1) as u64)
    .read_to_end(&mut bytes)
    .map_err(|e| format!("Failed to read uploaded file: {e}"))?;
  let is_truncated = bytes.len() > DATA_FILE_PREVIEW_LIMIT;
  bytes.truncate(DATA_FILE_PREVIEW_LIMIT);

  let utf8_error_is_only_truncated_character =
    std::str::from_utf8(&bytes).err().is_some_and(|error| {
      is_truncated
        && error.error_len().is_none()
        && error.valid_up_to() >= bytes.len().saturating_sub(4)
    });
  let is_binary = bytes.contains(&0)
    || (std::str::from_utf8(&bytes).is_err() && !utf8_error_is_only_truncated_character);
  let text = if is_binary {
    None
  } else {
    Some(String::from_utf8_lossy(&bytes).into_owned())
  };

  Ok(DataFilePreview {
    text,
    is_binary,
    is_truncated,
  })
}

#[tauri::command]
pub fn read_uploaded_molecule(app: AppHandle, stored_name: String) -> Result<String, String> {
  validate_stored_data_file_name(&stored_name)?;
  let extension = Path::new(&stored_name)
    .extension()
    .and_then(|value| value.to_str())
    .unwrap_or_default()
    .to_ascii_lowercase();
  if extension != "pdb" {
    return Err("Only PDB files can be loaded as molecular structures".to_string());
  }

  let path = uploaded_data_dir(&app)?.join(stored_name);
  let metadata =
    fs::metadata(&path).map_err(|e| format!("Failed to inspect molecular file: {e}"))?;
  if metadata.len() > MOLECULE_FILE_LIMIT {
    return Err("Molecular file exceeds the 64 MiB preview limit".to_string());
  }
  fs::read_to_string(path).map_err(|e| format!("Molecular file is not valid UTF-8 text: {e}"))
}

#[tauri::command]
pub fn get_uploaded_3d_model_path(app: AppHandle, stored_name: String) -> Result<String, String> {
  validate_stored_data_file_name(&stored_name)?;
  let extension = Path::new(&stored_name)
    .extension()
    .and_then(|value| value.to_str())
    .unwrap_or_default()
    .to_ascii_lowercase();
  if extension != "stl" && extension != "glb" {
    return Err("Only STL and GLB files can be loaded as 3D models".to_string());
  }

  let path = uploaded_data_dir(&app)?.join(stored_name);
  if !path.is_file() {
    return Err("Uploaded 3D model was not found".to_string());
  }
  Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn save_cad_process_snapshot(
  app: AppHandle,
  stored_name: String,
  snapshot_id: String,
  image_data_url: String,
) -> Result<String, String> {
  validate_stored_data_file_name(&stored_name)?;
  if !snapshot_id
    .chars()
    .all(|character| character.is_ascii_alphanumeric() || character == '-')
  {
    return Err("Invalid process snapshot ID".to_string());
  }
  let extension = Path::new(&stored_name)
    .extension()
    .and_then(|value| value.to_str())
    .unwrap_or_default()
    .to_ascii_lowercase();
  if extension != "stl" && extension != "glb" {
    return Err("Process snapshots are only available for STL and GLB files".to_string());
  }
  if !uploaded_data_dir(&app)?.join(&stored_name).is_file() {
    return Err("Uploaded 3D model was not found".to_string());
  }

  let encoded_image = image_data_url
    .strip_prefix("data:image/png;base64,")
    .ok_or_else(|| "Snapshot must be a PNG data URL".to_string())?;
  if encoded_image.len() > 28 * 1024 * 1024 {
    return Err("Process snapshot exceeds the 20 MiB limit".to_string());
  }
  let image = BASE64_STANDARD
    .decode(encoded_image)
    .map_err(|e| format!("Invalid snapshot image data: {e}"))?;
  if image.len() > 20 * 1024 * 1024 {
    return Err("Process snapshot exceeds the 20 MiB limit".to_string());
  }
  if !image.starts_with(b"\x89PNG\r\n\x1a\n") {
    return Err("Snapshot data is not a valid PNG image".to_string());
  }

  let snapshot_name = format!("{stored_name}.process-{snapshot_id}.png");
  let path = uploaded_data_dir(&app)?.join(snapshot_name);
  fs::write(&path, image).map_err(|e| format!("Failed to save process snapshot: {e}"))?;
  Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_cad_process_snapshot(
  app: AppHandle,
  stored_name: String,
  snapshot_id: String,
) -> Result<String, String> {
  validate_stored_data_file_name(&stored_name)?;
  if !snapshot_id
    .chars()
    .all(|character| character.is_ascii_alphanumeric() || character == '-')
  {
    return Err("Invalid process snapshot ID".to_string());
  }
  let path = uploaded_data_dir(&app)?.join(format!("{stored_name}.process-{snapshot_id}.png"));
  let metadata =
    fs::metadata(&path).map_err(|e| format!("Failed to inspect process snapshot: {e}"))?;
  if metadata.len() > 20 * 1024 * 1024 {
    return Err("Process snapshot exceeds the 20 MiB limit".to_string());
  }
  let image = fs::read(path).map_err(|e| format!("Failed to read process snapshot: {e}"))?;
  if !image.starts_with(b"\x89PNG\r\n\x1a\n") {
    return Err("Process snapshot is not a valid PNG image".to_string());
  }
  Ok(format!(
    "data:image/png;base64,{}",
    BASE64_STANDARD.encode(image)
  ))
}

#[tauri::command]
pub fn delete_cad_process_snapshot(
  app: AppHandle,
  stored_name: String,
  snapshot_id: String,
) -> Result<(), String> {
  validate_stored_data_file_name(&stored_name)?;
  if !snapshot_id
    .chars()
    .all(|character| character.is_ascii_alphanumeric() || character == '-')
  {
    return Err("Invalid process snapshot ID".to_string());
  }
  let path = uploaded_data_dir(&app)?.join(format!("{stored_name}.process-{snapshot_id}.png"));
  fs::remove_file(path).map_err(|e| format!("Failed to delete process snapshot: {e}"))
}

#[tauri::command]
pub fn delete_uploaded_data_file(app: AppHandle, stored_name: String) -> Result<(), String> {
  validate_stored_data_file_name(&stored_name)?;
  let directory = uploaded_data_dir(&app)?;
  let path = directory.join(&stored_name);
  fs::remove_file(path).map_err(|e| format!("Failed to delete uploaded file: {e}"))?;

  let snapshot_prefix = format!("{stored_name}.process-");
  for entry in
    fs::read_dir(&directory).map_err(|e| format!("Failed to read data directory: {e}"))?
  {
    let entry = entry.map_err(|e| format!("Failed to inspect data directory: {e}"))?;
    let file_name = entry.file_name();
    let file_name = file_name.to_string_lossy();
    if file_name.starts_with(&snapshot_prefix) && file_name.ends_with(".png") {
      fs::remove_file(entry.path())
        .map_err(|e| format!("Failed to delete process snapshot: {e}"))?;
    }
  }
  Ok(())
}

fn desktop_path(app: &AppHandle) -> Result<PathBuf, String> {
  let desktop = app.path().desktop_dir().map_err(|e| e.to_string())?;

  Ok(desktop)
}

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
pub fn list_image_files(app: AppHandle) -> Result<Vec<String>, String> {
  let desktop = desktop_path(&app)?;

  let directory = desktop.join("taskFllow").join("images");
  // ディレクトリが無ければ作る
  fs::create_dir_all(&directory).map_err(|e| e.to_string())?;

  println!("Reading directory: {:?}", directory);

  let entries = fs::read_dir(&directory).map_err(|e| format!("Failed to read dir: {}", e))?;

  let mut files = Vec::new();

  for entry in entries {
    let entry = entry.map_err(|e| e.to_string())?;
    let name = entry.file_name().to_string_lossy().to_string();
    files.push(name);
  }

  Ok(files)
}

#[tauri::command]
pub fn get_desktop_path(app: AppHandle) -> Result<String, String> {
  let desktop = desktop_path(&app)?;
  let dir = desktop.join("taskFllow").join("images");
  Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn ensure_image_dir(app: AppHandle) -> Result<String, String> {
  // AppData directory
  let app_dir = desktop_path(&app)?;

  // taskFllow/images
  let image_dir = app_dir.join("taskFllow").join("images");

  // フォルダ作成（存在していてもOK）
  fs::create_dir_all(&image_dir).map_err(|e| format!("Failed to create directory: {}", e))?;

  Ok(image_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn reading_file(file_path: String) -> Result<String, String> {
  println!("Reading file: {:?}", file_path);
  fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn read_binary_file(file_path: String) -> Result<Vec<u8>, String> {
  fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn writing_file(directory: String, file_name: String, content: String) -> Result<(), String> {
  let path = Path::new(&directory).join(&file_name);
  fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn write_binary_file(app: AppHandle, file_name: String, data: Vec<u8>) -> Result<(), String> {
  let base_dir = desktop_path(&app)?;

  // let base_dir = app
  //   .path()
  //   .app_data_dir()
  //   .map_err(|e| e.to_string())?;
  let dir = base_dir.join("taskFllow").join("images");

  fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

  let path: PathBuf = dir.join(file_name);

  fs::write(&path, data).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn add_file(directory: String, file_name: String, content: String) -> Result<String, String> {
  let path = Path::new(&directory).join(file_name);
  // let path = Path::new("target").join(file_name);

  fs::write(&path, content).map_err(|e| format!("Failed to write to file: {}", e))?;

  Ok("File has been successfully added!".to_string())
}

#[tauri::command]
pub fn deleting_file(directory: String, file_name: String) -> Result<String, String> {
  let path = Path::new(&directory).join(&file_name);

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
