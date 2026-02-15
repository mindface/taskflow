#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
  pub handle: usize,
  pub title: String,
  pub x: i32,
  pub y: i32,
  pub width: i32,
  pub height: i32,
  pub is_visible: bool,
  pub is_minimized: bool,
  pub thumbnail: Option<String>,
}

pub trait WindowCapture {
  fn get_all_windows() -> Vec<WindowInfo>;
  fn capture_window_thumbnail(
    handle: usize,
    target_width: u32,
    target_height: u32,
  ) -> Result<String, String>;
}

#[cfg(target_os = "windows")]
pub use windows::WindowsCapture as PlatformCapture;

#[cfg(target_os = "macos")]
pub use macos::MacOSCapture as PlatformCapture;

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub struct DummyCapture;

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
impl WindowCapture for DummyCapture {
  fn get_all_windows() -> Vec<WindowInfo> {
    println!("[DummyCapture] Platform not supported");
    Vec::new()
  }

  fn capture_window_thumbnail(
    _handle: usize,
    _target_width: u32,
    _target_height: u32,
  ) -> Result<String, String> {
    Err("Platform not supported".to_string())
  }
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub use DummyCapture as PlatformCapture;
