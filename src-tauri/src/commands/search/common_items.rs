use crate::db::db_core::get_conn;
use crate::models::note::SearchItem;
use rusqlite::{params_from_iter, ToSql};

#[tauri::command]
pub fn search_common_items(
  keyword: Option<String>,
  title: Option<String>,
  content: Option<String>,
  tag: Option<String>,
  role: Option<String>,
  limit: Option<i64>,
) -> Result<Vec<SearchItem>, String> {
  let conn = get_conn()?;
  let mut items: Vec<SearchItem> = Vec::new();

  let (note_clause, note_params) =
    build_search_clause(&keyword, &title, &content, false, false, None, None);
  let note_sql = format!(
    "SELECT id, title, content, created_at, updated_at, NULL AS tag, NULL AS role, 'note' AS source FROM notes WHERE 1=1 {} ORDER BY updated_at DESC",
    note_clause,
  );
  let mut note_stmt = conn
    .prepare(&note_sql)
    .map_err(|e| format!("Prepare note search error: {}", e))?;

  let note_rows = note_stmt
    .query_map(params_from_iter(note_params.iter()), |row| {
      Ok(SearchItem {
        source: row.get(7)?,
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        tag: None,
        role: None,
      })
    })
    .map_err(|e| format!("QueryMap note search error: {}", e))?;

  for row in note_rows {
    items.push(row.map_err(|e| format!("Read note search row error: {}", e))?);
  }

  let (llm_clause, llm_params) = build_search_clause(
    &keyword,
    &title,
    &content,
    true,
    true,
    tag.as_ref(),
    role.as_ref(),
  );
  let llm_sql = format!(
    "SELECT id, title, content, created_at, updated_at, tag, role, 'llm_memo' AS source FROM llm_memos WHERE 1=1 {} ORDER BY updated_at DESC",
    llm_clause,
  );
  let mut llm_stmt = conn
    .prepare(&llm_sql)
    .map_err(|e| format!("Prepare llm memo search error: {}", e))?;

  let llm_rows = llm_stmt
    .query_map(params_from_iter(llm_params.iter()), |row| {
      Ok(SearchItem {
        source: row.get(7)?,
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        tag: row.get::<_, Option<String>>(5)?,
        role: row.get::<_, Option<String>>(6)?,
      })
    })
    .map_err(|e| format!("QueryMap llm memo search error: {}", e))?;

  for row in llm_rows {
    items.push(row.map_err(|e| format!("Read llm memo search row error: {}", e))?);
  }

  items.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

  if let Some(max_limit) = limit {
    items.truncate(max_limit as usize);
  }

  Ok(items)
}

fn build_search_clause(
  keyword: &Option<String>,
  title: &Option<String>,
  content: &Option<String>,
  include_tag: bool,
  include_role: bool,
  tag: Option<&String>,
  role: Option<&String>,
) -> (String, Vec<Box<dyn ToSql>>) {
  let mut clause = String::new();
  let mut params: Vec<Box<dyn ToSql>> = Vec::new();

  if let Some(title_value) = title.as_ref().filter(|v| !v.trim().is_empty()) {
    clause.push_str(" AND title LIKE ? COLLATE NOCASE");
    params.push(Box::new(format!("%{}%", title_value.trim())));
  }

  if let Some(content_value) = content.as_ref().filter(|v| !v.trim().is_empty()) {
    clause.push_str(" AND content LIKE ? COLLATE NOCASE");
    params.push(Box::new(format!("%{}%", content_value.trim())));
  }

  if let Some(keyword_value) = keyword.as_ref().filter(|v| !v.trim().is_empty()) {
    clause.push_str(" AND (title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE");
    if include_tag {
      clause.push_str(" OR tag LIKE ? COLLATE NOCASE");
    }
    if include_role {
      clause.push_str(" OR role LIKE ? COLLATE NOCASE");
    }
    clause.push(')');

    let like_value = format!("%{}%", keyword_value.trim());
    params.push(Box::new(like_value.clone()));
    params.push(Box::new(like_value.clone()));
    if include_tag {
      params.push(Box::new(like_value.clone()));
    }
    if include_role {
      params.push(Box::new(like_value.clone()));
    }
  }

  if include_tag {
    if let Some(tag_value) = tag.and_then(|v| if !v.trim().is_empty() { Some(v) } else { None }) {
      clause.push_str(" AND tag LIKE ? COLLATE NOCASE");
      params.push(Box::new(format!("%{}%", tag_value.trim())));
    }
  }

  if include_role {
    if let Some(role_value) = role.and_then(|v| if !v.trim().is_empty() { Some(v) } else { None }) {
      clause.push_str(" AND role LIKE ? COLLATE NOCASE");
      params.push(Box::new(format!("%{}%", role_value.trim())));
    }
  }

  (clause, params)
}
