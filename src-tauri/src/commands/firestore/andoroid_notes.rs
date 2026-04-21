use crate::models::note::AndroidNote;
use firestore::*;

#[tauri::command]
pub async fn list_android_notes(user_id: Option<String>) -> Result<Vec<AndroidNote>, String> {
  let db = FirestoreDb::new("taskapp-1f863")
    .await
    .map_err(|e| format!("Firestore Client Initialization Error: {}", e))?;

  let base_query = db.fluent().select().from("notes");

  // フィルタリングを条件分岐で作成
  let notes: Vec<AndroidNote> = if let Some(uid) = user_id {
    base_query
      .filter(|q| q.for_all([q.field("userId").equal(uid.clone())]))
      .obj()
      .query()
      .await
  } else {
    base_query.obj().query().await
  }
  .map_err(|e| format!("Firestore Query Error: {}", e))?;

  Ok(notes)
}
