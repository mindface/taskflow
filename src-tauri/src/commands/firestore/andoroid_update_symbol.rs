use crate::models::note::AndroidNote;
use firestore::*;
use serde_json::json;

#[tauri::command]
pub async fn andoroid_update_note(note: AndroidNote) -> Result<(), String> {
  let db = FirestoreDb::new("mymodular-5b5b5")
    .await
    .map_err(|e| format!("Firestore Client Initialization Error: {}", e))?;

  let mut update_data = json!({});
  // 更新対象のドキュメント ID
  let note_id = note.id.clone();
  if note_id.is_empty() {
    return Err("note_id is empty".to_string());
  } else {
    update_data["id"] = json!(note_id);
  }
  // 更新データを準備
  if let Some(user_id) = &note.user_id {
    update_data["user_id"] = json!(user_id);
  }
  if let Some(title) = &note.title {
    update_data["title"] = json!(title);
  }
  if let Some(content) = &note.content {
    update_data["content"] = json!(content);
  }
  if let Some(created_at) = &note.created_at {
    update_data["created_at"] = json!(created_at);
  }
  if let Some(updated_at) = &note.updated_at {
    update_data["updated_at"] = json!(updated_at);
  }
  // if let Some(created_at) = &note.created_at {
  //     if let Ok(parsed) = created_at.parse::<i64>() {
  //         update_data["created_at"] = json!(parsed);
  //     } else {
  //         return Err("Invalid created_at format".to_string());
  //     }
  // }

  // if let Some(updated_at) = &note.updated_at {
  //     if let Ok(parsed) = updated_at.parse::<i64>() {
  //         update_data["updated_at"] = json!(parsed);
  //     } else {
  //         return Err("Invalid updated_at format".to_string());
  //     }
  // }
  println!("Update data prepared: {}", update_data);

  // Firestore ドキュメントの更新
  db.fluent()
    .update()
    .in_col("notes")
    .document_id(&update_data["id"].as_str().unwrap_or(""))
    .object(&update_data)
    .execute::<()>()
    .await
    .map_err(|e| format!("Firestore Update Error: {}", e))?;

  Ok(())
}
