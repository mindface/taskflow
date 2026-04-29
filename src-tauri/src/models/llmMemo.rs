use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LlmMemo {
  pub id: i64,
  pub title: String,
  pub content: String,
  pub created_at: String,
  pub updated_at: String,
  pub tag: String,
  pub role: String,
}
