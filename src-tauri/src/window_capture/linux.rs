// src-tauri/src/window_capture/linux.rs

use crate::window_capture::{WindowCapture, WindowInfo};

pub struct LinuxCapture;

impl WindowCapture for LinuxCapture {
  fn get_all_windows() -> Vec<WindowInfo> {
    // TODO: X11 または Wayland の API を使用してウィンドウを取得
    // 例: x11rb クレートなどを使用してウィンドウツリーを走査する
    println!("Linux implementation is called");
    vec![]
  }

  fn capture_window_thumbnail(
    _handle: usize,
    _target_width: u32,
    _target_height: u32,
  ) -> Result<String, String> {
    // TODO: スクリーンショットロジックの実装
    // Wayland の場合は XDG Desktop Portal (ScreenCast) を利用するのが一般的です
    Ok("".to_string())
  }
}
