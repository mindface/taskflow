use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Note {
  pub id: i64,
  pub title: String,
  pub content: String,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NoteDetail {
  pub note: Note,
  pub concepts: Vec<ConceptView>,
  pub relations: Vec<ConceptRelationView>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConceptProcessFactor {
  pub id: i64,
  pub conceptlist: Vec<i64>,
  pub name: String,
  pub description: Option<String>,
  pub infolink: Option<String>, // url link to more info
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConceptView {
  pub id: i64,
  pub name: String,
  pub description: Option<String>,
  pub infolink: Option<String>, // url link to more info
  pub role: Option<String>,     // explains / example_of
  pub tag: String,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConceptRelationView {
  pub from_concept_id: i64,
  pub to_concept_id: i64,
  pub relation_type: String,
}
