#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};

mod data_collection;
mod vector_store;
mod commands;
mod database;
mod error;
mod scheduler;

use database::Database;
use error::{Result};


#[derive(Debug, Serialize, Deserialize)]
pub struct HistoryEntry {
    timestamp: DateTime<Utc>,
    content: String,
    source: String,
    metadata: serde_json::Value,
}

#[derive(Debug, thiserror::Error, serde::Serialize)]
pub enum AppError {
    #[error("DB error: {0}")]
    SqlxError(String),

    #[error("IO error: {0}")]
    IoError(String),

    #[error("Other error: {0}")]
    Other(String),
}

#[tauri::command]
async fn process_history() -> std::result::Result<String, String> {
  let db = Database::new().await.map_err(|e| e.to_string())?;
  let pool = db.get_pool();

  data_collection::collect_history(pool)
      .await
      .map_err(|e| e.to_string())?;

  Ok("履歴の処理が完了しました".to_string())
}

#[tauri::command]
async fn query_history(query: String) -> std::result::Result<String, String> {
    let db = Database::new().await.map_err(|e| e.to_string())?;
    let pool = db.get_pool();

    let like_query = format!("%{}%", query);
    let results = sqlx::query!(
        r#"
        SELECT * FROM browser_history
        WHERE url LIKE ? OR title LIKE ?
        ORDER BY visit_time DESC
        LIMIT 10
        "#,
        like_query,
        like_query
    )
    .fetch_all(pool)
    .await
        .map_err(|e| e.to_string())?;

    let formatted_results = results
        .iter()
        .map(|r| format!("{} - {} ({})", r.title.clone().unwrap_or_default(), r.url, r.visit_time))
        .collect::<Vec<_>>()
        .join("\n");

    Ok(formatted_results)
}

fn main() -> Result<()> {
    // let scheduler = Scheduler::new(60);
    // tokio::spawn(async move {
    //   scheduler.start().await.unwrap_or_else(|e| {
    //       eprintln!("Scheduler error: {}", e);
    //   });
    // });


    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            process_history,
            query_history,
            commands::file_operations::list_files,
            commands::file_operations::reading_file,
            commands::file_operations::writing_file,
            commands::file_operations::add_file,
            commands::file_operations::deleteing_file,
            commands::file_operations::export_pdf,
            commands::file_operations::export_to_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
        
    Ok(())
}
