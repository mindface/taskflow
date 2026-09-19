use crate::window_capture::{PlatformCapture, WindowCapture, WindowInfo};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::sync::{Mutex, OnceLock};
use tauri::{Emitter, Manager};

static WINDOW_PAGE_PATHS: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();
static REMOVED_WINDOWS: OnceLock<Mutex<HashSet<usize>>> = OnceLock::new();

fn window_page_paths() -> &'static Mutex<HashMap<String, String>> {
  WINDOW_PAGE_PATHS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn removed_windows() -> &'static Mutex<HashSet<usize>> {
  REMOVED_WINDOWS.get_or_init(|| Mutex::new(HashSet::new()))
}

#[derive(Clone, Serialize)]
pub struct AppWindowsPayload {
  pub count: usize,
  pub windows: Vec<WindowInfo>,
}

fn label_handle(label: &str) -> usize {
  let mut hash: u64 = 5381;
  for byte in label.bytes() {
    hash = hash.wrapping_mul(33).wrapping_add(byte as u64);
  }
  hash as usize
}

fn page_path_for(title: &str, label: &str, paths: &HashMap<String, String>) -> Option<String> {
  if let Some(path) = paths.get(title) {
    return Some(path.clone());
  }
  if let Some(path) = paths.get(label) {
    return Some(path.clone());
  }
  for prefix in ["preview", "submemo_maker", "main", "schedule"] {
    if label == prefix || label.starts_with(&format!("{prefix}_")) {
      if let Some(path) = paths.get(prefix) {
        return Some(path.clone());
      }
    }
  }
  None
}

pub fn collect_app_windows(app: &tauri::AppHandle) -> AppWindowsPayload {
  let paths = window_page_paths()
    .lock()
    .map(|guard| guard.clone())
    .unwrap_or_default();

  let mut windows = Vec::new();
  for (label, window) in app.webview_windows() {
    let title = window.title().unwrap_or_else(|_| label.clone());
    let position = window.outer_position().ok();
    let size = window.outer_size().ok();
    windows.push(WindowInfo {
      handle: label_handle(&label),
      title: title.clone(),
      owner_name: Some("Taskflow".to_string()),
      x: position.map(|pos| pos.x).unwrap_or(0),
      y: position.map(|pos| pos.y).unwrap_or(0),
      width: size.map(|size| size.width as i32).unwrap_or(0),
      height: size.map(|size| size.height as i32).unwrap_or(0),
      is_visible: window.is_visible().unwrap_or(true),
      is_minimized: window.is_minimized().unwrap_or(false),
      thumbnail: None,
      page_path: page_path_for(&title, &label, &paths),
      label: Some(label),
    });
  }

  windows.sort_by(|left, right| left.title.cmp(&right.title).then(left.label.cmp(&right.label)));

  AppWindowsPayload {
    count: windows.len(),
    windows,
  }
}

pub fn emit_app_windows(app: &tauri::AppHandle) {
  let payload = collect_app_windows(app);
  if let Err(error) = app.emit("app-windows-updated", payload) {
    println!("[emit_app_windows] Failed to emit: {}", error);
  }
}

#[tauri::command]
pub fn list_app_windows(app: tauri::AppHandle) -> Result<AppWindowsPayload, String> {
  Ok(collect_app_windows(&app))
}

#[tauri::command]
pub fn focus_app_window(app: tauri::AppHandle, label: String) -> Result<(), String> {
  crate::commands::window_view::raise_all_app_windows(&app, &label);
  Ok(())
}

#[tauri::command]
pub fn set_window_page_path(app: tauri::AppHandle, title: String, path: String) -> Result<(), String> {
  {
    let mut paths = window_page_paths().lock().map_err(|e| e.to_string())?;
    paths.insert(title, path);
  }
  emit_app_windows(&app);
  Ok(())
}

#[tauri::command]
pub fn remove_window(app: tauri::AppHandle, handle: usize, title: Option<String>) -> Result<(), String> {
  println!("[remove_window] Removing window with handle: {} title: {:?}", handle, title);

  let windows = app.webview_windows();
  for (label, window) in windows {
    let current_title = match window.title() {
      Ok(title) => title,
      Err(err) => {
        println!("[remove_window] Failed to read window title: {}", err);
        continue;
      }
    };

    let title_matches = title.as_deref() == Some(current_title.as_str());
    if title_matches || label_handle(&label) == handle {
      println!("[remove_window] Closing matching Tauri window: {}", current_title);
      if let Err(err) = window.close() {
        println!("[remove_window] Failed to close {}: {}", current_title, err);
      }
      return Ok(());
    }
  }

  let mut removed = removed_windows().lock().map_err(|e| e.to_string())?;
  removed.insert(handle);
  Ok(())
}

#[tauri::command]
pub fn get_all_windows() -> Result<Vec<WindowInfo>, String> {
  let removed = removed_windows().lock().map_err(|e| e.to_string())?.clone();
  let mut windows = PlatformCapture::get_all_windows();
  let paths = window_page_paths().lock().map_err(|e| e.to_string())?.clone();

  windows.retain(|window| !removed.contains(&window.handle));

  for window in &mut windows {
    window.page_path = paths.get(&window.title).cloned();
  }

  Ok(windows)
}

#[tauri::command]
pub fn get_all_windows_with_thumbnails(
  thumbnail_width: u32,
  thumbnail_height: u32,
) -> Result<Vec<WindowInfo>, String> {
  println!(
    "[get_all_windows_with_thumbnails] Called with {}x{}",
    thumbnail_width, thumbnail_height
  );

  let removed = removed_windows().lock().map_err(|e| e.to_string())?.clone();
  let mut windows = PlatformCapture::get_all_windows();
  let paths = window_page_paths().lock().map_err(|e| e.to_string())?.clone();

  windows.retain(|window| !removed.contains(&window.handle));

  for window in &mut windows {
    window.page_path = paths.get(&window.title).cloned();
  }

  println!(
    "[get_all_windows_with_thumbnails] Got {} windows initially",
    windows.len()
  );

  let mut success_count = 0;
  let mut fail_count = 0;

  for window in windows.iter_mut() {
    println!(
      "[get_all_windows_with_thumbnails] Processing: {} (minimized: {}, size: {}x{})",
      window.title, window.is_minimized, window.width, window.height
    );

    if !window.is_minimized && window.width > 0 && window.height > 0 {
      match PlatformCapture::capture_window_thumbnail(
        window.handle,
        thumbnail_width,
        thumbnail_height,
      ) {
        Ok(thumbnail) => {
          println!(
            "[get_all_windows_with_thumbnails] ✓ Captured: {}",
            window.title
          );
          window.thumbnail = Some(thumbnail);
          success_count += 1;
        }
        Err(e) => {
          println!(
            "[get_all_windows_with_thumbnails] ✗ Failed {}: {}",
            window.title, e
          );
          window.thumbnail = None;
          fail_count += 1;
        }
      }
    } else {
      println!(
        "[get_all_windows_with_thumbnails] Skipped: {}",
        window.title
      );
    }
  }

  println!(
    "[get_all_windows_with_thumbnails] Success: {}, Failed: {}, Total: {}",
    success_count,
    fail_count,
    windows.len()
  );

  Ok(windows)
}

#[tauri::command]
pub fn capture_window(handle: usize, width: u32, height: u32) -> Result<String, String> {
  PlatformCapture::capture_window_thumbnail(handle, width, height)
}

fn build_focus_window_script(app_name: &str, window_id: usize) -> String {
  format!(
    "tell application \"System Events\"\n  tell process \"{}\"\n    set targetWindow to first window whose id is {}\n    if exists targetWindow then\n      set frontmost to true\n      set frontmost of targetWindow to true\n      perform action \"AXRaise\" of targetWindow\n    end if\n  end tell\nend tell",
    app_name.replace('"', "\\\""),
    window_id
  )
}

#[tauri::command]
pub fn focus_window(handle: usize) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use windows::Win32::Foundation::*;
    use windows::Win32::UI::WindowsAndMessaging::*;

    unsafe {
      let hwnd = HWND(handle as isize);
      SetForegroundWindow(hwnd);

      if IsIconic(hwnd).as_bool() {
        ShowWindow(hwnd, SW_RESTORE);
      }

      Ok(())
    }
  }

  #[cfg(target_os = "macos")]
  {
    use std::process::Command;

    let target_window = match PlatformCapture::get_all_windows()
      .into_iter()
      .find(|window| window.handle == handle)
    {
      Some(window) => window,
      None => return Err(format!("No window found for handle {}", handle)),
    };

    let app_name = match target_window.owner_name {
      Some(name) => name,
      None => return Err(format!("No app owner found for window handle {}", handle)),
    };

    let window_id = target_window.handle;

    println!(
      "[focus_window] Target window handle {} (app: {}, id: {})",
      handle, app_name, window_id
    );

    let scripts = [
      build_focus_window_script(&app_name, window_id),
      format!(
        "tell application \"{}\" to activate",
        app_name.replace('"', "\\\"")
      ),
    ];

    for script in &scripts {
      let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| format!("Failed to run osascript: {}", e))?;

      if output.status.success() {
        println!(
          "[focus_window] Focus command succeeded for window {} in app: {}",
          window_id, app_name
        );
        return Ok(());
      }

      let stderr = String::from_utf8_lossy(&output.stderr);
      println!(
        "[focus_window] Focus command failed for window {} in app '{}': {}",
        window_id, app_name, stderr
      );
    }

    Err(format!(
      "Failed to focus window {} in app '{}': all macOS window focus attempts failed",
      window_id, app_name
    ))
  }

  #[cfg(not(any(target_os = "windows", target_os = "macos")))]
  Err("Not implemented for this platform".to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn focus_window_script_uses_window_id() {
    let script = build_focus_window_script("Preview", 123456);
    assert!(script.contains("whose id is 123456"));
    assert!(script.contains("set frontmost of targetWindow to true"));
    assert!(!script.contains("tell application \"Preview\" to activate"));
  }
}

// #[tauri::command]
// pub fn get_platform_info() -> String {
//   let os = std::env::consts::OS;
//   let arch = std::env::consts::ARCH;

//   println!("[get_platform_info] OS: {}, Arch: {}", os, arch);

//   format!("OS: {}, Architecture: {}", os, arch) // ← セミコロンなし（return文）
// }

#[tauri::command]
pub fn test_enum_windows() -> Result<String, String> {
  println!("[test_enum_windows] Starting test...");

  #[cfg(target_os = "windows")]
  {
    use windows::Win32::Foundation::*;
    use windows::Win32::UI::WindowsAndMessaging::*;

    let mut count = 0;

    unsafe {
      println!("[test_enum_windows] Calling EnumWindows...");

      let result = EnumWindows(
        Some(|hwnd: HWND, _: LPARAM| -> BOOL {
          count += 1;

          let mut buffer = [0u16; 512];
          let len = GetWindowTextW(hwnd, &mut buffer);

          if len > 0 {
            let title = String::from_utf16_lossy(&buffer[..len as usize]);
            let is_visible = IsWindowVisible(hwnd).as_bool();

            if count <= 10 {
              println!(
                "[test_enum_windows] #{}: '{}' (visible: {})",
                count, title, is_visible
              );
            }
          }

          TRUE
        }),
        LPARAM(0),
      );

      println!("[test_enum_windows] EnumWindows result: {:?}", result);
      println!("[test_enum_windows] Total windows enumerated: {}", count);

      Ok(format!(
        "Enumerated {} windows. Result: {:?}",
        count, result
      ))
    }
  }

  #[cfg(not(target_os = "windows"))]
  {
    Err("Not on Windows".to_string())
  }
}
