use crate::db::db_core::get_conn;
use crate::models::user::User;
use chrono::Utc;
use rusqlite::params;

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
