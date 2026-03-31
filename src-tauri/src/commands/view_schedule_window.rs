use crate::models::schedule::Schedule;
use crate::models::state::PreviewState;
use crate::models::state::ScheduleState;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};

#[tauri::command]
pub fn sync_schedule_to_preview(
  app: tauri::AppHandle,
  state: tauri::State<Mutex<ScheduleState>>,
  schedule: Schedule,
) -> Result<(), String> {
  {
    let mut state = state.lock().unwrap();
    state.schedule = schedule.clone();
  }
  app
    .emit_to("preview", "schedule-update", serde_json::json!(schedule))
    .map_err(|e: tauri::Error| {
      let err = format!("Failed to emit event: {}", e);
      println!("[Rust] ERROR: {}", err);
      e.to_string()
    })?;

  Ok(())
}

#[tauri::command]
pub fn open_schedule_window(
  app: tauri::AppHandle,
  state: tauri::State<Mutex<PreviewState>>,
  open_continuous: bool,
) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("preview") {
    if open_continuous {
      return Ok(());
    }
    let _ = window.close().ok();
  }

  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs();
  let label = format!("preview_{}", now);

  tauri::webview::WebviewWindowBuilder::new(
    &app,
    label,
    tauri::WebviewUrl::App("index.html".into()),
  )
  .title("プレビュー")
  .inner_size(800.0, 600.0)
  .resizable(true)
  .initialization_script(
    r#"
      window.__TAURI_WINDOW_LABEL__ = 'schedule';
    "#,
  )
  .build()
  .map_err(|e| {
    let err = format!("Failed to build window: {}", e);
    println!("[Rust] ERROR: {}", err);
    err
  })?;

  Ok(())
}

#[tauri::command]
pub fn get_target_schedule_content(
  state: tauri::State<std::sync::Mutex<ScheduleState>>,
) -> Result<Schedule, String> {
  let state = state.lock().unwrap();

  Ok(state.schedule.clone())
}
