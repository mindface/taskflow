use crate::models::note::Note;
use crate::models::state::PreviewState;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};

static RAISING_APP_WINDOWS: AtomicBool = AtomicBool::new(false);
static APP_HAS_FOCUS: AtomicBool = AtomicBool::new(false);
static LAST_RAISE: Mutex<Option<Instant>> = Mutex::new(None);

struct RaisingGuard;

impl Drop for RaisingGuard {
  fn drop(&mut self) {
    RAISING_APP_WINDOWS.store(false, Ordering::SeqCst);
  }
}

/// Bring every Taskflow window in front of other apps, keeping `focused_label` on top.
pub fn raise_all_app_windows(app: &tauri::AppHandle, focused_label: &str) {
  raise_all_app_windows_inner(app, focused_label, true);
}

fn raise_all_app_windows_inner(app: &tauri::AppHandle, focused_label: &str, activate: bool) {
  if RAISING_APP_WINDOWS.swap(true, Ordering::SeqCst) {
    return;
  }
  let _guard = RaisingGuard;

  if let Ok(mut last_raise) = LAST_RAISE.lock() {
    let now = Instant::now();
    if let Some(previous) = *last_raise {
      if now.duration_since(previous) < Duration::from_millis(150) {
        return;
      }
    }
    *last_raise = Some(now);
  }

  let windows = app.webview_windows();
  for (label, window) in &windows {
    if label == focused_label {
      continue;
    }
    raise_window(window, false);
  }

  if let Some(focused) = windows.get(focused_label) {
    raise_window(focused, activate);
  }
}

fn raise_window(window: &tauri::WebviewWindow, activate: bool) {
  let _ = window.unminimize();
  let _ = window.show();

  #[cfg(target_os = "macos")]
  order_front_macos(window);

  #[cfg(target_os = "windows")]
  order_front_windows(window, activate);

  if activate && !window.is_focused().unwrap_or(false) {
    let _ = window.set_focus();
  }
}

pub fn handle_app_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
  match event {
    tauri::WindowEvent::Focused(true) => {
      APP_HAS_FOCUS.store(true, Ordering::SeqCst);
      raise_all_app_windows_inner(window.app_handle(), window.label(), false);
    }
    tauri::WindowEvent::Focused(false) => {
      let any_focused = window
        .app_handle()
        .webview_windows()
        .values()
        .any(|item| item.is_focused().unwrap_or(false));
      if !any_focused {
        APP_HAS_FOCUS.store(false, Ordering::SeqCst);
      }
    }
    tauri::WindowEvent::Destroyed => {
      crate::commands::window_manager::emit_app_windows(window.app_handle());
    }
    _ => {}
  }
}

#[cfg(target_os = "macos")]
#[allow(unexpected_cfgs)]
fn order_front_macos(window: &tauri::WebviewWindow) {
  use cocoa::base::id;
  use objc::{msg_send, sel, sel_impl};

  if let Ok(ns_window) = window.ns_window() {
    unsafe {
      let ns_window = ns_window as id;
      let _: () = msg_send![ns_window, orderFrontRegardless];
    }
  }
}

#[cfg(target_os = "windows")]
fn order_front_windows(window: &tauri::WebviewWindow, activate: bool) {
  use windows::Win32::Foundation::HWND;
  use windows::Win32::UI::WindowsAndMessaging::{
    SetWindowPos, HWND_TOP, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW,
  };

  let Ok(hwnd) = window.hwnd() else {
    return;
  };

  let mut flags = SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW;
  if !activate {
    flags |= SWP_NOACTIVATE;
  }

  unsafe {
    let _ = SetWindowPos(HWND(hwnd.0 as isize), HWND_TOP, 0, 0, 0, 0, flags);
  }
}

struct WindowSpec {
  kind: &'static str,
  title: &'static str,
  js_label: &'static str,
}

fn open_named_window(
  app: &tauri::AppHandle,
  spec: WindowSpec,
  open_continuous: bool,
) -> Result<(), String> {
  let existing = app
    .webview_windows()
    .into_iter()
    .find(|(label, _)| label.starts_with(spec.kind));

  if let Some((_, window)) = existing {
    if open_continuous {
      println!(
        "[Rust] {} window already open, keeping it open due to open_continuous=true",
        spec.kind
      );
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
  crate::commands::window_manager::emit_app_windows(app);
  Ok(())
}

pub fn start_main_window_impl(app: &tauri::AppHandle) -> Result<(), String> {
  let label = format!("main_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs());
  println!("[Rust] Starting main window: {}", label);

  let _main_window = tauri::webview::WebviewWindowBuilder::new(
    app,
    &label,
    tauri::WebviewUrl::App("index.html".into()),
  )
  .title("Taskflow")
  .inner_size(1400.0, 900.0)
  .resizable(true)
  .build()
  .map_err(|e| {
    let err = format!("Failed to build main window: {}", e);
    println!("[Rust] ERROR: {}", err);
    err
  })?;

  println!("[Rust] Main window created successfully: {}", label);
  crate::commands::window_manager::emit_app_windows(app);
  Ok(())
}

#[tauri::command]
pub fn start_main_window(app: tauri::AppHandle) -> Result<(), String> {
  start_main_window_impl(&app)
}

pub fn open_initial_windows(app: &tauri::AppHandle) -> Result<(), String> {
  start_main_window_impl(app)?;
  open_named_window(
    app,
    WindowSpec {
      kind: "preview",
      title: "プレビュー",
      js_label: "preview",
    },
    false,
  )?;
  open_named_window(
    app,
    WindowSpec {
      kind: "submemo_maker",
      title: "サブメモ",
      js_label: "submemo_maker",
    },
    false,
  )?;
  Ok(())
}

#[tauri::command]
pub fn open_preview_window(app: tauri::AppHandle, open_continuous: bool) -> Result<(), String> {
  open_named_window(
    &app,
    WindowSpec {
      kind: "preview",
      title: "プレビュー",
      js_label: "preview",
    },
    open_continuous,
  )
}

#[tauri::command]
pub fn open_submemo_window(app: tauri::AppHandle, open_continuous: bool) -> Result<(), String> {
  open_named_window(
    &app,
    WindowSpec {
      kind: "submemo_maker",
      title: "サブメモ",
      js_label: "submemo_maker",
    },
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
