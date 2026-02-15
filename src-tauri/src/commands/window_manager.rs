use crate::window_capture::{PlatformCapture, WindowCapture, WindowInfo};

#[tauri::command]
pub fn get_all_windows() -> Result<Vec<WindowInfo>, String> {
  Ok(PlatformCapture::get_all_windows())
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

  let mut windows = PlatformCapture::get_all_windows();
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

#[tauri::command]
pub fn focus_window(_handle: usize) -> Result<(), String> {
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

  #[cfg(not(target_os = "windows"))]
  Err("Not implemented for this platform".to_string())
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
