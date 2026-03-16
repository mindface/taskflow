use crate::commands::db_core::get_conn;
use crate::models::schedule::Schedule;

#[tauri::command]
pub fn list_schedule_task() -> Result<Vec<Schedule>, String> {
  let conn = get_conn()?;

  let mut stmt = conn
    .prepare(
      "
        SELECT id, title, description, created_at, updated_at
        FROM schedules
        ORDER BY created_at DESC
        ",
    )
    .map_err(|e| format!("prepare schedule error: {}", e))?;

  let rows = stmt
    .query_map([], |row| {
      Ok(Schedule {
        id: row.get(0)?,
        title: row.get(1)?,
        description: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        tasks: vec![],
      })
    })
    .map_err(|e| format!("query_map schedule error: {}", e))?;

  let mut schedules = Vec::new();

  for r in rows {
    schedules.push(r.map_err(|e| format!("row read error: {}", e))?);
  }

  Ok(schedules)
}
