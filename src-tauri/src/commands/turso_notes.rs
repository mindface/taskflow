use crate::db::turso;
use crate::models::note::ShareNote;

#[tauri::command]
pub async fn turso_create_table() -> Result<(), String> {
  let conn = turso::connect().await?;
  turso::create_table(&conn).await
}

#[tauri::command]
pub async fn turso_insert_share_note(note: ShareNote) -> Result<(), String> {
  let conn = turso::connect().await?;
  turso::insert(&conn, &note).await
}

#[tauri::command]
pub async fn turso_list_share_notes() -> Result<Vec<ShareNote>, String> {
  let conn = turso::connect().await?;
  turso::list_notes(&conn).await
}

#[tauri::command]
pub async fn turso_get_share_note(id: i64) -> Result<Option<ShareNote>, String> {
  let conn = turso::connect().await?;
  turso::get_note(&conn, id).await
}

#[tauri::command]
pub async fn turso_update_share_note(note: ShareNote) -> Result<(), String> {
  let conn = turso::connect().await?;
  turso::update_note(&conn, &note).await
}

#[tauri::command]
pub async fn turso_delete_share_note(id: i64) -> Result<(), String> {
  let conn = turso::connect().await?;
  turso::delete_note(&conn, id).await
}
