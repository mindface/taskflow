use crate::models::note::AndroidSymbol;
use firestore::*;
use serde_json::json;

fn build_symbol_update_data(symbol: &AndroidSymbol) -> serde_json::Value {
  let mut update_data = json!({});
  println!("Building update data for symbol: {:?}", symbol);

  let symbol_id = symbol._id.clone();
  // if symbol_id.is_empty() {
  //   return update_data;
  // }

  update_data["id"] = json!(symbol_id);

  if let Some(user_id) = &symbol.user_id {
    update_data["user_id"] = json!(user_id);
  }
  if let Some(title) = &symbol.title {
    update_data["title"] = json!(title);
  }
  if let Some(content) = &symbol.content {
    update_data["content"] = json!(content);
  }
  if let Some(created_at) = &symbol.created_at {
    update_data["created_at"] = json!(created_at);
  }
  if let Some(updated_at) = &symbol.updated_at {
    update_data["updated_at"] = json!(updated_at);
  }
  if let Some(symbol_type) = &symbol.symbol_type {
    update_data["symbol_type"] = json!(symbol_type);
  }
  if let Some(extension) = &symbol.extension {
    update_data["extension"] = json!(extension);
  }
  if let Some(language) = &symbol.language {
    update_data["language"] = json!(language);
  }

  return update_data;
}

#[tauri::command]
pub async fn andoroid_update_symbol(symbol_info: AndroidSymbol) -> Result<AndroidSymbol, String> {
  let db = FirestoreDb::new("mymodular-5b5b5")
    .await
    .map_err(|e| format!("Firestore Client Initialization Error: {}", e))?;

  let update_data = build_symbol_update_data(&symbol_info);
  let symbol_id = update_data["id"].as_str().unwrap_or("").to_string();

  if symbol_id.is_empty() {
    return Err("symbol_id is empty".to_string());
  }

  db.fluent()
    .update()
    .in_col("symbols")
    .document_id(&symbol_id)
    .object(&update_data)
    .execute::<()>()
    .await
    .map_err(|e| format!("Firestore Update Error: {}", e))?;

  Ok(symbol_info)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn builds_update_payload_with_symbol_fields() {
    let symbol = AndroidSymbol {
      id: "symbol-1".to_string(),
      _id: None,
      user_id: Some("user-1".to_string()),
      title: Some("main.rs".to_string()),
      content: Some("fn main() {}".to_string()),
      created_at: Some("2024-01-01".to_string()),
      updated_at: Some("2024-01-02".to_string()),
      symbol_type: Some("source".to_string()),
      extension: Some("rs".to_string()),
      language: Some("rust".to_string()),
    };

    let update_data = build_symbol_update_data(&symbol);

    assert_eq!(update_data["id"], "symbol-1");
    assert_eq!(update_data["user_id"], "user-1");
    assert_eq!(update_data["title"], "main.rs");
    assert_eq!(update_data["content"], "fn main() {}");
    assert_eq!(update_data["extension"], "rs");
    assert_eq!(update_data["language"], "rust");
  }
}
