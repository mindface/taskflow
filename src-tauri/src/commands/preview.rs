use crate::models::note::Note;
use crate::models::state::PreviewState;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};

#[tauri::command]
pub fn open_preview_window(app: tauri::AppHandle, open_continuous: bool) -> Result<(), String> {
  // 既存のプレビューウィンドウがあれば閉じる
  if let Some(window) = app.get_webview_window("preview") {
    if open_continuous {
      println!("[Rust] Preview window already open, keeping it open due to open_continuous=true");
      return Ok(());
    }
    println!("[Rust] Closing existing preview window");
    let _ = window.close(); // 型推論のため let _ = を使用
  }

  // 毎回ユニークなラベルを作成する（例: preview_1712345678）
  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs();
  let label = format!("preview_{}", now);

  let _preview_window = tauri::webview::WebviewWindowBuilder::new(
    &app,
    &label,
    tauri::WebviewUrl::App("index.html".into()),
  )
  .title("プレビュー")
  .inner_size(800.0, 600.0)
  .resizable(true)
  .initialization_script(
    r#"
      window.__TAURI_WINDOW_LABEL__ = 'preview';
    "#,
  )
  .build()
  .map_err(|e| {
    let err = format!("Failed to build window: {}", e);
    println!("[Rust] ERROR: {}", err);
    err
  })?;

  println!("[Rust] Preview window created successfully");
  Ok(())
}

#[tauri::command]
pub fn sync_content_to_preview(
  app: tauri::AppHandle,
  state: tauri::State<Mutex<PreviewState>>,
  content: String,
  title: String,
) -> Result<(), String> {
  {
    let mut state = state.lock().unwrap();
    state.content = content.clone();
    state.title = title.clone();
  }
  app
    .emit_to(
      "preview",
      "content-update",
      serde_json::json!({
          "content": content,
          "title": title,
      }),
    )
    .map_err(|e: tauri::Error| {
      let err = format!("Failed to emit event: {}", e);
      println!("[Rust] ERROR: {}", err);
      e.to_string()
    })?;

  // [TODO] Tauriのバージョンをあげて検証予定
  // if app.get_window("preview").is_none() {
  //     println!("preview window not found");
  //     return Ok(());
  // }
  // app.emit_to(
  //   "preview",
  //   "content-update",
  //   serde_json::json!({
  //     "content": content,
  //     "title": title,
  //   }),
  // )
  // .map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_current_preview_content(
  state: tauri::State<Mutex<PreviewState>>,
) -> Result<serde_json::Value, String> {
  let state = state.lock().unwrap();

  Ok(serde_json::json!({
      "content": state.content,
      "title": state.title,
  }))
}

#[tauri::command]
pub fn sync_note_data_to_preview(app: tauri::AppHandle, note_data: Note) -> Result<(), String> {
  app
    .emit_to("preview", "note-data-update", note_data)
    .map_err(|e| e.to_string())?;
  Ok(())
}
