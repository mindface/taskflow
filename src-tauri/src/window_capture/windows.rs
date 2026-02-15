// src-tauri/src/window_capture/windows.rs
use super::{WindowCapture, WindowInfo};
use std::mem;
use std::sync::Mutex;
use windows::{
  core::*, Win32::Foundation::*, Win32::Graphics::Dwm::*, Win32::Graphics::Gdi::*,
  Win32::UI::WindowsAndMessaging::*,
};

// グローバルなデバッグカウンタ
static ENUM_COUNT: Mutex<usize> = Mutex::new(0);

pub struct WindowsCapture;

impl WindowCapture for WindowsCapture {
  fn get_all_windows() -> Vec<WindowInfo> {
    println!("[WindowsCapture::get_all_windows] Starting...");

    unsafe {
      let mut windows = Vec::new();

      // カウンタをリセット
      if let Ok(mut count) = ENUM_COUNT.lock() {
        *count = 0;
      }

      println!("[WindowsCapture] Calling EnumWindows...");

      let result = EnumWindows(
        Some(enum_windows_proc),
        LPARAM(&mut windows as *mut Vec<WindowInfo> as isize),
      );

      println!("[WindowsCapture] EnumWindows returned: {:?}", result);

      if let Ok(count) = ENUM_COUNT.lock() {
        println!("[WindowsCapture] Callback was called {} times", *count);
      }

      println!(
        "[WindowsCapture] Total windows collected: {}",
        windows.len()
      );

      // 最初の5件を表示
      for (i, window) in windows.iter().take(5).enumerate() {
        println!(
          "[WindowsCapture] Window {}: '{}' ({}x{}, minimized: {})",
          i, window.title, window.width, window.height, window.is_minimized
        );
      }

      windows
    }
  }

  fn capture_window_thumbnail(
    handle: usize,
    target_width: u32,
    target_height: u32,
  ) -> Result<String, String> {
    println!(
      "[WindowsCapture] Capturing thumbnail for handle: {}",
      handle
    );

    unsafe {
      let hwnd = HWND(handle as isize);

      // ウィンドウが有効か確認
      if !IsWindow(hwnd).as_bool() {
        return Err("Invalid window handle".to_string());
      }

      let mut rect = RECT::default();
      GetWindowRect(hwnd, &mut rect).map_err(|e| e.to_string())?;

      let width = (rect.right - rect.left) as i32;
      let height = (rect.bottom - rect.top) as i32;

      println!("[WindowsCapture] Window size: {}x{}", width, height);

      if width <= 0 || height <= 0 {
        return Err(format!("Invalid window size: {}x{}", width, height));
      }

      let hdc_screen = GetDC(None);
      let hdc_mem = CreateCompatibleDC(hdc_screen);
      let hbitmap = CreateCompatibleBitmap(hdc_screen, width, height);
      let old_bitmap = SelectObject(hdc_mem, hbitmap);

      let _ = PrintWindow(hwnd, hdc_mem, PRINT_WINDOW_FLAGS(0));

      let mut bmp_info = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
          biSize: mem::size_of::<BITMAPINFOHEADER>() as u32,
          biWidth: width,
          biHeight: -height,
          biPlanes: 1,
          biBitCount: 32,
          biCompression: BI_RGB.0 as u32,
          ..Default::default()
        },
        ..Default::default()
      };

      let mut buffer = vec![0u8; (width * height * 4) as usize];
      GetDIBits(
        hdc_mem,
        hbitmap,
        0,
        height as u32,
        Some(buffer.as_mut_ptr() as *mut _),
        &mut bmp_info,
        DIB_RGB_COLORS,
      );

      SelectObject(hdc_mem, old_bitmap);
      let _ = DeleteObject(hbitmap);
      let _ = DeleteDC(hdc_mem);
      let _ = ReleaseDC(None, hdc_screen);

      // BGRAからRGBAに変換
      for chunk in buffer.chunks_exact_mut(4) {
        chunk.swap(0, 2);
      }

      let img = ImageBuffer::<image::Rgba<u8>, _>::from_raw(width as u32, height as u32, buffer)
        .ok_or("Failed to create image")?;

      let thumbnail = image::imageops::resize(
        &img,
        target_width,
        target_height,
        image::imageops::FilterType::Lanczos3,
      );

      let mut png_data = Vec::new();
      thumbnail
        .write_to(
          &mut std::io::Cursor::new(&mut png_data),
          image::ImageOutputFormat::Png,
        )
        .map_err(|e| e.to_string())?;

      let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_data);
      println!(
        "[WindowsCapture] Successfully captured thumbnail ({} bytes)",
        png_data.len()
      );

      Ok(format!("data:image/png;base64,{}", base64_string))
    }
  }
}

unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
  // カウンタをインクリメント
  if let Ok(mut count) = ENUM_COUNT.lock() {
    *count += 1;

    // 最初の10回だけログを出力
    if *count <= 10 {
      println!(
        "[enum_windows_proc] Callback #{} called with HWND: {:?}",
        *count, hwnd.0
      );
    }
  }

  let windows = &mut *(lparam.0 as *mut Vec<WindowInfo>);

  // 可視性チェック
  let is_visible = IsWindowVisible(hwnd).as_bool();

  // タイトルを取得
  let mut title_buffer = [0u16; 512];
  let length = GetWindowTextW(hwnd, &mut title_buffer);

  if length == 0 {
    return TRUE; // タイトルなし、スキップ
  }

  let title = String::from_utf16_lossy(&title_buffer[..length as usize]);

  // 空のタイトルをスキップ
  if title.trim().is_empty() {
    return TRUE;
  }

  // 可視でないウィンドウをスキップ
  if !is_visible {
    return TRUE;
  }

  // ウィンドウの位置とサイズ
  let mut rect = RECT::default();
  let _ = GetWindowRect(hwnd, &mut rect);

  let mut placement = WINDOWPLACEMENT {
    length: mem::size_of::<WINDOWPLACEMENT>() as u32,
    ..Default::default()
  };
  let _ = GetWindowPlacement(hwnd, &mut placement);

  let window_info = WindowInfo {
    handle: hwnd.0 as usize,
    title: title.clone(),
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    is_visible: true,
    is_minimized: placement.showCmd == SW_SHOWMINIMIZED.0 as u32,
    thumbnail: None,
  };

  // 最初の10件はログ出力
  if let Ok(count) = ENUM_COUNT.lock() {
    if *count <= 10 {
      println!(
        "[enum_windows_proc] Adding window: '{}' ({}x{}, visible: {}, minimized: {})",
        window_info.title,
        window_info.width,
        window_info.height,
        is_visible,
        window_info.is_minimized
      );
    }
  }

  windows.push(window_info);

  TRUE
}
