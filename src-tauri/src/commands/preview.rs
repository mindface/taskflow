use crate::models::note::Note;
use crate::models::state::PreviewState;
use std::sync::Mutex;
use tauri::Manager;

#[tauri::command]
pub fn open_preview_window(app: tauri::AppHandle) -> Result<(), String> {
  // 既存のプレビューウィンドウがあれば閉じる
  if let Some(window) = app.get_window("preview") {
    window.close().ok();
  }

  let _preview_window =
    tauri::WindowBuilder::new(&app, "preview", tauri::WindowUrl::App("index.html".into()))
      .title("プレビュー")
      .inner_size(800.0, 600.0)
      .resizable(true)
      .initialization_script(
        r#"
        window.__TAURI_WINDOW_LABEL__ = 'preview';
    "#,
      )
      .build()
      .map_err(|e| e.to_string())?;

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
    .emit_all(
      "content-update",
      serde_json::json!({
          "content": content,
          "title": title,
      }),
    )
    .map_err(|e| {
      println!("emit_all error: {:?}", e);
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
