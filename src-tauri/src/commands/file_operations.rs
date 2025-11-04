use std::fs;
use std::path::{Path, PathBuf};
use std::io::{self, Write};
use genpdf::{Document, elements, fonts};
use serde::Deserialize;
use serde::Serialize;
use tauri::api::path::document_dir;
use tauri::api::path::app_data_dir;
use std::fs::File;
use tauri::{AppHandle};

#[derive(Deserialize)]
pub struct Person {
    name: String,
    age: u32,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Task {
    pub name: String,
    pub title: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Config {
    pub directory: String,
    pub tasks: Vec<Task>,
}

#[tauri::command]
pub fn load_config(config_path: String) -> Result<Config, String> {
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    let config: Config = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;
    Ok(config)
}

#[tauri::command]
pub fn list_task_files(config_path: String) -> Result<Vec<String>, String> {
    let config = load_config(config_path)?;
    let dir_path = Path::new(&config.directory);

    let entries = fs::read_dir(dir_path)
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
pub fn get_tasks(config_path: String) -> Result<Vec<Task>, String> {
    let config = load_config(config_path)?;
    Ok(config.tasks)
}

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
pub fn writing_file(directory: String, file_name: String, content: String) -> Result<(), String> {
    let path = Path::new(&directory).join(&file_name);
    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn add_file(directory: String, file_name: String, content: String) -> Result<String, String> {
    let path = Path::new(&directory).join(file_name);
    // let path = Path::new("target").join(file_name);

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

#[tauri::command]
pub fn export_pdf(output_path: String,text: String) -> Result<(), String> {
    let font_family = fonts::from_files("fonts", "LiberationSans", None)
        .map_err(|e| e.to_string())?;

    let mut doc = Document::new(font_family);
    doc.set_title("Generated PDF");
    doc.push(elements::Paragraph::new(text));

    doc.render_to_file(output_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_to_csv(app: AppHandle, data: Vec<Person>) -> Result<(), String> {
    let header = "name,age\n";
    let mut csv_content = String::from(header);

    for person in data {
        csv_content.push_str(&format!("{},{}\n", person.name, person.age));
    }

    // let file_path: PathBuf = match app_data_dir(&*app.config()) {
    //     Some(mut dir) => {
    //         dir.push("exported_data.csv");
    //         dir
    //     }
    //     None => return Err("Could not find app data directory.".into()),
    // };
    let mut file_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    file_path.push("csv/exported_data.csv");
    println!("CSV file path: {:?}", file_path);

    File::create(&file_path)
        .and_then(|mut file| file.write_all(csv_content.as_bytes()))
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}
