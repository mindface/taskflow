use crate::commands::user::load_saved_user_firebase_credential;
use std::path::Path;
use std::path::PathBuf;

// pub fn google_application_credentials_path() -> PathBuf {
//   if let Some(path) = std::env::var_os("GOOGLE_APPLICATION_CREDENTIALS") {
//     return PathBuf::from(path);
//   }

//   PathBuf::from("/Users/asdfghjkl/program/rust/taskflow/mymodular-256390a262.json")
// }

// pub fn google_application_credentials_json() -> Result<String, String> {
//   let path: PathBuf = google_application_credentials_path();
//   std::env::set_var("GOOGLE_APPLICATION_CREDENTIALS", &path);
//   println!("GOOGLE_APPLICATION_CREDENTIALS={}", path.display());
//   fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path.display(), e))
// }

pub fn apply_saved_google_credentials(path: &str) -> Result<String, String> {
  let resolved = PathBuf::from(path);
  std::env::set_var("GOOGLE_APPLICATION_CREDENTIALS", &resolved);
  Ok(resolved.to_string_lossy().to_string())
}

/// GOOGLE_APPLICATION_CREDENTIALS が有効か確認し、未設定または空の場合は
/// 保存されたユーザー設定からロードして環境変数に再適用する共通関数
pub fn ensure_google_credentials(user_id: Option<&str>) -> Result<String, String> {
  // 1. すでに有効な環境変数がセットされているか確認
  if let Ok(env_path) = std::env::var("GOOGLE_APPLICATION_CREDENTIALS") {
    let trimmed = env_path.trim();
    if !trimmed.is_empty() && Path::new(trimmed).exists() {
      return Ok(trimmed.to_string());
    }
  }

  // 2. 環境変数が未設定/無効で、user_id が渡されている場合は JSON から復元
  if let Some(uid) = user_id {
    if let Ok(Some(saved_path)) = load_saved_user_firebase_credential(uid) {
      let trimmed = saved_path.trim();
      if !trimmed.is_empty() && Path::new(trimmed).exists() {
        println!("Applying saved GOOGLE_APPLICATION_CREDENTIALS for user '{uid}': {trimmed}");

        // ⚡️ 環境変数にセット
        std::env::set_var("GOOGLE_APPLICATION_CREDENTIALS", trimmed);
        return Ok(trimmed.to_string());
      }
    }
  }

  // 3. どこからも認証情報が取得できなかった場合のエラー処理
  Err("Google/Firebase credentials path is not set or file does not exist.".to_string())
}
