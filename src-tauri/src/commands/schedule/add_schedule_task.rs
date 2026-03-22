use crate::db::db_core::get_conn;
use rusqlite::params;

#[tauri::command]
pub fn add_schedule_task(
  schedule_id: i64,
  task_id: i64,
  title: String,
  detail: String,
  starttime: String,
  endtime: String,
  targetdate: String,
) -> Result<i64, String> {
  let conn = get_conn()?;

  conn
    .execute(
      "
      INSERT INTO schedule_tasks
      (
        schedule_id,
        task_id,
        title,
        detail,
        start_time,
        end_time,
        target_date
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      ",
      params![
        schedule_id,
        task_id,
        title,
        detail,
        starttime,
        endtime,
        targetdate
      ],
    )
    .map_err(|e| format!("insert schedule task error: {}", e))?;

  Ok(conn.last_insert_rowid())
}
