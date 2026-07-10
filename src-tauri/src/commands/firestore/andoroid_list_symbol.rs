use crate::models::note::AndroidSymbol;
use firestore::*;

#[tauri::command]
pub async fn andoroid_list_symbol(user_id: Option<String>) -> Result<Vec<AndroidSymbol>, String> {
  let db = FirestoreDb::new("mymodular-5b5b5")
    .await
    .map_err(|e| format!("Firestore Client Initialization Error: {}", e))?;

  let base_query = db.fluent().select().from("symbols");

  let symbols: Vec<AndroidSymbol> = if let Some(uid) = user_id {
    base_query
      .filter(|q| q.for_all([q.field("user_id").equal(uid.clone())]))
      .obj()
      .query()
      .await
  } else {
    base_query.obj().query().await
  }
  .map_err(|e| format!("Firestore Query Error: {}", e))?;

  Ok(symbols)
}
