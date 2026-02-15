// src-tauri/src/window_capture/macos.rs
use super::{WindowCapture, WindowInfo};

pub struct MacOSCapture;

#[cfg(target_os = "macos")]
impl WindowCapture for MacOSCapture {
  fn get_all_windows() -> Vec<WindowInfo> {
    println!("[MacOSCapture::get_all_windows] Starting on macOS...");

    use core_foundation::array::CFArrayGetCount;
    use core_foundation::base::{CFRelease, TCFType};
    use core_foundation::dictionary::CFDictionaryRef;
    use core_foundation::number::CFNumberGetValue;
    use core_foundation::string::CFString;
    use core_graphics::window::{
      kCGWindowListExcludeDesktopElements, kCGWindowListOptionOnScreenOnly,
    };

    let mut windows = Vec::new();

    unsafe {
      let window_list = core_graphics::window::CGWindowListCopyWindowInfo(
        kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
        0,
      );

      if window_list.is_null() {
        println!("[MacOSCapture] Failed to get window list");
        return windows;
      }

      let count = CFArrayGetCount(window_list as _);
      println!("[MacOSCapture] Found {} windows", count);

      for i in 0..count {
        let window_info =
          core_foundation::array::CFArrayGetValueAtIndex(window_list as _, i) as CFDictionaryRef;

        // ウィンドウレイヤーをチェック（通常のウィンドウのみ）
        let layer_key = CFString::from_static_string("kCGWindowLayer");
        let layer_value = core_foundation::dictionary::CFDictionaryGetValue(
          window_info,
          layer_key.as_concrete_TypeRef() as *const _,
        );

        // ウィンドウ名を取得
        let name_key = CFString::from_static_string("kCGWindowName");
        let name_value = core_foundation::dictionary::CFDictionaryGetValue(
          window_info,
          name_key.as_concrete_TypeRef() as *const _,
        );

        let mut layer: i32 = 0;
        if !layer_value.is_null() {
          CFNumberGetValue(
            layer_value as core_foundation::number::CFNumberRef,
            core_foundation::number::kCFNumberSInt32Type,
            &mut layer as *mut i32 as *mut _,
          );
        }

        // レイヤー0のみ（通常のウィンドウ）を対象
        if layer != 0 {
          continue;
        }

        if name_value.is_null() {
          continue;
        }

        let title =
          CFString::wrap_under_get_rule(name_value as core_foundation::string::CFStringRef)
            .to_string();

        if title.is_empty() {
          continue;
        }

        // Alpha値をチェック（透明度）
        let alpha_key = CFString::from_static_string("kCGWindowAlpha");
        let alpha_value = core_foundation::dictionary::CFDictionaryGetValue(
          window_info,
          alpha_key.as_concrete_TypeRef() as *const _,
        );

        let mut alpha: f64 = 1.0;
        if !alpha_value.is_null() {
          CFNumberGetValue(
            alpha_value as core_foundation::number::CFNumberRef,
            core_foundation::number::kCFNumberFloat64Type,
            &mut alpha as *mut f64 as *mut _,
          );
        }

        // 透明なウィンドウをスキップ
        if alpha < 0.1 {
          continue;
        }

        // オーナー名（アプリ名）を取得
        let owner_name_key = CFString::from_static_string("kCGWindowOwnerName");
        let _owner_name_value = core_foundation::dictionary::CFDictionaryGetValue(
          window_info,
          owner_name_key.as_concrete_TypeRef() as *const _,
        );

        // ウィンドウ番号（ID）を取得
        let number_key = CFString::from_static_string("kCGWindowNumber");
        let number_value = core_foundation::dictionary::CFDictionaryGetValue(
          window_info,
          number_key.as_concrete_TypeRef() as *const _,
        );

        let mut window_id: i32 = 0;
        if !number_value.is_null() {
          CFNumberGetValue(
            number_value as core_foundation::number::CFNumberRef,
            core_foundation::number::kCFNumberSInt32Type,
            &mut window_id as *mut i32 as *mut _,
          );
        }

        // ウィンドウのバウンド（位置とサイズ）を取得
        let bounds_key = CFString::from_static_string("kCGWindowBounds");
        let bounds_value = core_foundation::dictionary::CFDictionaryGetValue(
          window_info,
          bounds_key.as_concrete_TypeRef() as *const _,
        );

        let mut x = 0i32;
        let mut y = 0i32;
        let mut width = 0i32;
        let mut height = 0i32;

        if !bounds_value.is_null() {
          let bounds_dict = bounds_value as CFDictionaryRef;

          // X座標
          let x_key = CFString::new("X");
          let x_value = core_foundation::dictionary::CFDictionaryGetValue(
            bounds_dict,
            x_key.as_concrete_TypeRef() as *const _,
          );
          if !x_value.is_null() {
            CFNumberGetValue(
              x_value as core_foundation::number::CFNumberRef,
              core_foundation::number::kCFNumberSInt32Type,
              &mut x as *mut i32 as *mut _,
            );
          }

          // Y座標
          let y_key = CFString::new("Y");
          let y_value = core_foundation::dictionary::CFDictionaryGetValue(
            bounds_dict,
            y_key.as_concrete_TypeRef() as *const _,
          );
          if !y_value.is_null() {
            CFNumberGetValue(
              y_value as core_foundation::number::CFNumberRef,
              core_foundation::number::kCFNumberSInt32Type,
              &mut y as *mut i32 as *mut _,
            );
          }

          // 幅
          let width_key = CFString::new("Width");
          let width_value = core_foundation::dictionary::CFDictionaryGetValue(
            bounds_dict,
            width_key.as_concrete_TypeRef() as *const _,
          );
          if !width_value.is_null() {
            CFNumberGetValue(
              width_value as core_foundation::number::CFNumberRef,
              core_foundation::number::kCFNumberSInt32Type,
              &mut width as *mut i32 as *mut _,
            );
          }

          // 高さ
          let height_key = CFString::new("Height");
          let height_value = core_foundation::dictionary::CFDictionaryGetValue(
            bounds_dict,
            height_key.as_concrete_TypeRef() as *const _,
          );
          if !height_value.is_null() {
            CFNumberGetValue(
              height_value as core_foundation::number::CFNumberRef,
              core_foundation::number::kCFNumberSInt32Type,
              &mut height as *mut i32 as *mut _,
            );
          }
        }

        println!(
          "[MacOSCapture] Window: '{}' ({}x{} at {}, {})",
          title, width, height, x, y
        );

        windows.push(WindowInfo {
          handle: window_id as usize,
          title,
          x,
          y,
          width,
          height,
          is_visible: true,
          is_minimized: false,
          thumbnail: None,
        });
      }

      CFRelease(window_list as *const _);
    }

    println!("[MacOSCapture] Collected {} windows", windows.len());
    windows
  }

  fn capture_window_thumbnail(
    handle: usize,
    target_width: u32,
    target_height: u32,
  ) -> Result<String, String> {
    println!(
      "[MacOSCapture] Capturing window {} ({}x{})",
      handle, target_width, target_height
    );

    // macOSでのウィンドウキャプチャは権限が必要で複雑なため、
    // まずはプレースホルダー画像を返す
    Err("Screenshot capture not yet implemented for macOS".to_string())
  }
}

#[cfg(not(target_os = "macos"))]
impl WindowCapture for MacOSCapture {
  fn get_all_windows() -> Vec<WindowInfo> {
    Vec::new()
  }

  fn capture_window_thumbnail(
    _handle: usize,
    _target_width: u32,
    _target_height: u32,
  ) -> Result<String, String> {
    Err("Not on macOS".to_string())
  }
}
