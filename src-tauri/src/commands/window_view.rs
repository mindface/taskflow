use crate::models::note::Note;
use crate::models::state::PreviewState;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};

struct WindowSpec {
  kind: &'static str,
  title: &'static str,
  js_label: &'static str,
}

fn open_named_window(app: &tauri::AppHandle, spec: WindowSpec, open_continuous: bool) -> Result<(), String> {
  let existing = app
    .webview_windows()
    .into_iter()
    .find(|(label, _)| label.starts_with(spec.kind));

  if let Some((_, window)) = existing {
    if open_continuous {
      println!("[Rust] {} window already open, keeping it open due to open_continuous=true", spec.kind);
      return Ok(());
    }
    println!("[Rust] Closing existing {} window", spec.kind);
    let _ = window.close();
  }

  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs();
  let label = format!("{}_{}", spec.kind, now);

  let _window = tauri::webview::WebviewWindowBuilder::new(
    app,
    &label,
    tauri::WebviewUrl::App("index.html".into()),
  )
  .title(spec.title)
  .inner_size(800.0, 600.0)
  .resizable(true)
  .initialization_script(format!(
    r#"
      window.__TAURI_WINDOW_LABEL__ = '{}';
    "#,
    spec.js_label,
  ))
  .build()
  .map_err(|e| {
    let err = format!("Failed to build window: {}", e);
    println!("[Rust] ERROR: {}", err);
    err
  })?;

  println!("[Rust] {} window created successfully", spec.kind);
  Ok(())
}

pub fn open_initial_windows(app: &tauri::AppHandle) -> Result<(), String> {
  open_named_window(app, WindowSpec { kind: "preview", title: "プレビュー", js_label: "preview" }, false)?;
  open_named_window(app, WindowSpec { kind: "submemo_maker", title: "サブメモ", js_label: "submemo_maker" }, false)?;
  Ok(())
}

#[tauri::command]
pub fn open_preview_window(app: tauri::AppHandle, open_continuous: bool) -> Result<(), String> {
  open_named_window(
    &app,
    WindowSpec { kind: "preview", title: "プレビュー", js_label: "preview" },
    open_continuous,
  )
}

#[tauri::command]
pub fn open_submemo_window(app: tauri::AppHandle, open_continuous: bool) -> Result<(), String> {
  open_named_window(
    &app,
    WindowSpec { kind: "submemo_maker", title: "サブメモ", js_label: "submemo_maker" },
    open_continuous,
  )
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
