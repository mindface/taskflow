use crate::commands::firestore::google_credentials::{
  apply_saved_google_credentials, ensure_google_credentials,
};
use crate::models::note::AndroidSymbol;
use firestore::*;

#[tauri::command]
pub async fn andoroid_list_symbol(user_id: Option<String>) -> Result<Vec<AndroidSymbol>, String> {
  ensure_google_credentials(user_id.as_deref())?;

  if let Ok(path) = std::env::var("GOOGLE_APPLICATION_CREDENTIALS") {
    println!("Using Firebase credentials from env: {path}");
  } else if let Ok(Some(saved_path)) =
    crate::commands::user::load_saved_user_firebase_credential("default")
  {
    let _ = apply_saved_google_credentials(&saved_path);
  }

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
