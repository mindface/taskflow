use std::fs;
use std::path::{Path, PathBuf};
use std::io::{self, Write};

#[tauri::command]
pub fn list_files(directory: Option<String>) -> Result<Vec<String>, String> {
    let dir_path = directory
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));

    println!("Reading directory: {:?}", dir_path); 

    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

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
pub fn writing_file(file_name: String, content: String) -> Result<(), String> {
    fs::write(&file_name, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn add_file(file_name: String, content: String) -> Result<String, String> {
    let path = Path::new("target").join(file_name);

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write to file: {}", e))?;

    Ok("File has been successfully added!".to_string())
}

#[tauri::command]
pub fn deleteing_file (file_name: String) -> Result<String, String> {
    let path = Path::new("target").join(&file_name);

    if !path.exists() {
        return Err(format!("File '{}' does not exist.", file_name));
    }

    fs::remove_file(&path).map_err(|e: io::Error| format!("Failed to delete file: {}", e))?;

    Ok(format!("File '{}' has been successfully deleted!", file_name))
}
