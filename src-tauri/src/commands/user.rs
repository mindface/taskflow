use crate::db::db_core::get_conn;
use crate::models::user::User;
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

pub fn init_firebase_credentials_from_user_config() {
  // すでに OS 側の環境変数が設定されていればそれを優先
  if let Ok(path) = std::env::var("GOOGLE_APPLICATION_CREDENTIALS") {
    if !path.trim().is_empty() {
      println!("Already set via OS env: {}", path);
      return;
    }
  }

  // .taskflow/users/ 内の json ファイルを探索（あるいは特定の uid を指定）
  let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
  let users_dir = PathBuf::from(home).join(".taskflow").join("users");

  if let Ok(entries) = fs::read_dir(users_dir) {
    for entry in entries.flatten() {
      let path = entry.path();
      // .json ファイルを見つけたら中身をパース
      if path.extension().and_then(|s| s.to_str()) == Some("json") {
        if let Ok(content) = fs::read_to_string(&path) {
          if let Ok(config) = serde_json::from_str::<UserCredentialConfig>(&content) {
            if let Some(cred_path) = config.firebase_credential_path {
              if !cred_path.trim().is_empty() && std::path::Path::new(&cred_path).exists() {
                println!("Setting GOOGLE_APPLICATION_CREDENTIALS to: {}", cred_path);
                // 🔑 ここで環境変数をプロセス全体に設定する！
                std::env::set_var("GOOGLE_APPLICATION_CREDENTIALS", &cred_path);
                break;
              }
            }
          }
        }
      }
    }
  }
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct UserCredentialConfig {
  firebase_credential_path: Option<String>,
}

fn user_config_dir() -> Result<PathBuf, String> {
  let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
  let dir = PathBuf::from(home).join(".taskflow").join("users");
  fs::create_dir_all(&dir).map_err(|e| format!("Create user config dir error: {e}"))?;
  Ok(dir)
}

fn user_config_path(firebase_uid: &str) -> Result<PathBuf, String> {
  let dir = user_config_dir()?;
  Ok(dir.join(format!("{}.json", firebase_uid)))
}

// pub fn ensure_user_credential_config(firebase_uid: &str) -> Result<PathBuf, String> {
//   let path = user_config_path(firebase_uid)?;
//   if path.exists() {
//     return Ok(path);
//   }

//   let default_config = UserCredentialConfig {
//     firebase_credential_path: None,
//   };
//   save_user_config(firebase_uid, &default_config)?;
//   Ok(path)
// }

fn load_user_config(firebase_uid: &str) -> Result<UserCredentialConfig, String> {
  let path = user_config_path(firebase_uid)?;
  if !path.exists() {
    return Ok(UserCredentialConfig::default());
  }

  let content = fs::read_to_string(&path).map_err(|e| format!("Read user config error: {e}"))?;
  let config: UserCredentialConfig = serde_json::from_str(&content).map_err(|e| format!("Parse user config error: {e}"))?;
  Ok(config)
}

fn save_user_config(firebase_uid: &str, config: &UserCredentialConfig) -> Result<(), String> {
  let path = user_config_path(firebase_uid)?;
  let content = serde_json::to_string_pretty(config)
    .map_err(|e| format!("Serialize user config error: {e}"))?;
  fs::write(&path, content).map_err(|e| format!("Write user config error: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn add_user(
  firebase_uid: String,
  email: String,
  display_name: String,
  activated: bool,
  roles: Option<String>,
  ui_selection: Option<String>,
) -> Result<i64, String> {
  let conn = get_conn()?;
  let now = Utc::now().to_rfc3339();
  conn.execute(
    "INSERT INTO users (firebase_uid, email, display_name, activated, roles, ui_selection, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
    params![
      firebase_uid,
      email,
      display_name,
      activated as i64,
      roles,
      ui_selection,
      now,
      now
    ],
  )
  .map_err(|e| format!("Insert user error: {}", e))?;
  Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn list_users() -> Result<Vec<User>, String> {
  let conn = get_conn()?;
  let mut stmt = conn
    .prepare(
      "SELECT id, firebase_uid, email, display_name, activated, roles, ui_selection, created_at, updated_at FROM users ORDER BY updated_at DESC",
    )
    .map_err(|e| format!("Prepare user list error: {}", e))?;
  let rows = stmt
    .query_map([], |row| {
      Ok(User {
        id: row.get(0)?,
        firebase_uid: row.get(1)?,
        email: row.get(2)?,
        display_name: row.get(3)?,
        activated: row.get(4)?,
        roles: row.get(5)?,
        ui_selection: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
      })
    })
    .map_err(|e| format!("QueryMap user error: {}", e))?;

  let mut users = Vec::new();
  for user in rows {
    users.push(user.map_err(|e| format!("Row read error: {}", e))?);
  }
  Ok(users)
}

#[tauri::command]
pub fn save_user_firebase_credential(
  firebase_uid: String,
  credential_path: String,
) -> Result<String, String> {
  let config = UserCredentialConfig {
    firebase_credential_path: Some(credential_path.clone()),
  };
  save_user_config(&firebase_uid, &config)?;
  Ok(credential_path)
}

#[tauri::command]
pub fn get_user_firebase_credential(firebase_uid: String) -> Result<Option<String>, String> {
  let config = load_user_config(&firebase_uid)?;
  Ok(config.firebase_credential_path)
}

pub fn load_saved_user_firebase_credential(firebase_uid: &str) -> Result<Option<String>, String> {
  let config = load_user_config(firebase_uid)?;
  Ok(config.firebase_credential_path)
}

#[tauri::command]
pub fn update_user(
  id: i64,
  firebase_uid: String,
  email: String,
  display_name: String,
  activated: bool,
  roles: Option<String>,
  ui_selection: Option<String>,
) -> Result<i64, String> {
  let conn = get_conn()?;
  let now = Utc::now().to_rfc3339();
  conn.execute(
    "UPDATE users SET firebase_uid = ?1, email = ?2, display_name = ?3, activated = ?4, roles = ?5, ui_selection = ?6, updated_at = ?7 WHERE id = ?8",
    params![
      firebase_uid,
      email,
      display_name,
      activated as i64,
      roles,
      ui_selection,
      now,
      id,
    ],
  )
  .map_err(|e| format!("Update user error: {}", e))?;
  Ok(id)
}
