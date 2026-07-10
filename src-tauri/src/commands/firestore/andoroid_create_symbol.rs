use crate::models::note::AndroidSymbol;
use firestore::*;
use serde_json::json;

fn build_create_payload(symbol_info: &AndroidSymbol) -> serde_json::Value {
  let mut obj = json!({});

  if let Some(u) = &symbol_info.user_id {
    obj["user_id"] = json!(u);
  }
  if let Some(t) = &symbol_info.title {
    obj["title"] = json!(t);
  }
  if let Some(c) = &symbol_info.content {
    obj["content"] = json!(c);
  }
  if let Some(cr) = &symbol_info.created_at {
    obj["created_at"] = json!(cr);
  }
  if let Some(up) = &symbol_info.updated_at {
    obj["updated_at"] = json!(up);
  }
  if let Some(st) = &symbol_info.symbol_type {
    obj["symbol_type"] = json!(st);
  }
  if let Some(ex) = &symbol_info.extension {
    obj["extension"] = json!(ex);
  }
  if let Some(l) = &symbol_info.language {
    obj["language"] = json!(l);
  }

  obj
}

#[tauri::command]
pub async fn andoroid_create_symbol(symbol_info: AndroidSymbol) -> Result<AndroidSymbol, String> {
  let db = FirestoreDb::new("mymodular-5b5b5")
    .await
    .map_err(|e| format!("Firestore Client Initialization Error: {}", e))?;

  let payload = build_create_payload(&symbol_info);

  let resp = db
    .fluent()
    .insert()
    .into("symbols")
    .generate_document_id()
    .object(&payload)
    .execute::<serde_json::Value>()
    .await
    .map_err(|e| format!("Firestore Create Error: {}", e))?;

  // Firestore returns a Document with a `name` field like
  // "projects/<proj>/databases/(default)/documents/symbols/<doc_id>"
  let doc_id = resp
    .get("name")
    .and_then(|v| v.as_str())
    .and_then(|s| s.rsplit('/').next())
    .unwrap_or("")
    .to_string();

  let mut out = symbol_info.clone();
  out.id = doc_id;

  Ok(out)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn builds_payload_without_manual_document_id() {
    let symbol = AndroidSymbol {
      id: String::new(),
      user_id: Some("user-1".to_string()),
      title: Some("main.rs".to_string()),
      content: Some("fn main() {}".to_string()),
      created_at: Some("2026-07-05".to_string()),
      updated_at: Some("2026-07-05".to_string()),
      symbol_type: Some("source".to_string()),
      extension: Some("rs".to_string()),
      language: Some("rust".to_string()),
    };

    let payload = build_create_payload(&symbol);
    assert_eq!(payload["title"], "main.rs");
    assert_eq!(payload["extension"], "rs");
    assert!(payload.get("id").is_none());
  }
}
