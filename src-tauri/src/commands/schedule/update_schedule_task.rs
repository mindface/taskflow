use crate::db::db_core::get_conn;
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
  run_starttime: Option<i64>,
  run_endtime: Option<i64>,
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
        target_date = ?7,
        run_starttime = ?8,
        run_endtime = ?9
      WHERE id = ?10
      ",
      params![
        schedule_id,
        task_id,
        title,
        detail,
        starttime,
        endtime,
        targetdate,
        run_starttime,
        run_endtime,
        id,
      ],
    )
    .map_err(|e| format!("update schedule task error: {}", e))?;

  Ok(())
}

#[tauri::command]
pub fn update_start_task(scheduleTaskId: i64) -> Result<(), String> {
  let conn = get_conn()?;
  println!("@@@");
  println!("{}", scheduleTaskId);

  let now = chrono::Utc::now().timestamp();
  conn
    .execute(
      "
      UPDATE schedule_tasks
      SET run_starttime = ?
      WHERE id = ?
      ",
      [now, scheduleTaskId],
    )
    .map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
pub fn update_end_task(scheduleTaskId: i64) -> Result<(), String> {
  let conn = get_conn()?;

  let now = chrono::Utc::now().timestamp();

  let start: i64 = conn
    .query_row(
      "SELECT run_starttime FROM schedule_tasks WHERE id = ?",
      [scheduleTaskId],
      |row| row.get(0),
    )
    .unwrap_or(0);

  let elapsed = now - start;

  conn
    .execute(
      "
    UPDATE schedule_tasks
    SET run_endtime = ?, elapsed_time = ?
    WHERE id = ?
    ",
      [now, elapsed, scheduleTaskId],
    )
    .map_err(|e| e.to_string())?;

  Ok(())
}
