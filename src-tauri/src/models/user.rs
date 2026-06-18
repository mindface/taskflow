use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
  pub id: i64,
  pub firebase_uid: String,
  pub email: String,
  pub display_name: String,
  pub activated: bool,
  pub roles: Option<String>,
  pub ui_selection: Option<String>,
  pub created_at: String,
  pub updated_at: String,
}
