use crate::commands::db_core::get_conn;

use chrono::Utc;
use rusqlite::params;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ScheduleTaskInput {
  pub task_id: i64,
  pub title: String,
  pub detail: String,
  pub starttime: String,
  pub endtime: String,
  pub targetdate: String,
}

#[tauri::command]
pub fn update_list_schedule_task(
  id: i64,
  title: String,
  description: Option<String>,
  tasks: Vec<ScheduleTaskInput>,
) -> Result<(), String> {
  let mut conn = get_conn()?;

  let now = Utc::now().to_rfc3339();

  let tx = conn.transaction().map_err(|e| format!("tx error: {}", e))?;

  // schedule update
  tx.execute(
    "
    UPDATE schedules
    SET title = ?1,
        description = ?2,
        updated_at = ?3
    WHERE id = ?4
    ",
    params![title, description, now, id],
  )
  .map_err(|e| format!("update schedule error: {}", e))?;

  // delete old tasks
  tx.execute(
    "
    DELETE FROM schedule_tasks
    WHERE schedule_id = ?1
    ",
    params![id],
  )
  .map_err(|e| format!("delete tasks error: {}", e))?;

  // insert tasks
  for t in tasks {
    tx.execute(
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
        id,
        t.task_id,
        t.title,
        t.detail,
        t.starttime,
        t.endtime,
        t.targetdate
      ],
    )
    .map_err(|e| format!("insert task error: {}", e))?;
  }

  tx.commit().map_err(|e| format!("commit error: {}", e))?;

  Ok(())
}
