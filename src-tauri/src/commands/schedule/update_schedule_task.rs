use crate::commands::db_core::get_conn;

use rusqlite::params;

#[tauri::command]
pub fn update_schedule_task(
  id: i64,
  schedule_id: i64,
  task_id: i64,
  title: String,
  detail: String,
  starttime: String,
  endtime: String,
  targetdate: String,
) -> Result<(), String> {
  let conn = get_conn()?;

  conn
    .execute(
      "
      UPDATE schedule_tasks SET
        schedule_id = ?1,
        task_id = ?2,
        title = ?3,
        detail = ?4,
        start_time = ?5,
        end_time = ?6,
        target_date = ?7
      WHERE id = ?8
      ",
      params![
        schedule_id,
        task_id,
        title,
        detail,
        starttime,
        endtime,
        targetdate,
        id,
      ],
    )
    .map_err(|e| format!("update schedule task error: {}", e))?;

  Ok(())
}
