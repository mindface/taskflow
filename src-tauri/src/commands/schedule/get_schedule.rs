use crate::db::db_core::get_conn;
use crate::models::schedule::{Schedule, ScheduleTask};
use rusqlite::params;

#[tauri::command]
pub fn get_schedule_detail(schedule_id: i64) -> Result<Schedule, String> {
  let conn = get_conn()?;

  let schedule = conn
    .query_row(
      "
      SELECT id, title, description, created_at, updated_at
      FROM schedules
      WHERE id = ?1
      ",
      params![schedule_id],
      |row| {
        Ok(Schedule {
          id: row.get(0)?,
          title: row.get(1)?,
          description: row.get(2)?,
          created_at: row.get(3)?,
          updated_at: row.get(4)?,
          tasks: vec![],
        })
      },
    )
    .map_err(|e| format!("schedule query error: {}", e))?;

  let mut stmt = conn
    .prepare(
      "
        SELECT
            id,
            schedule_id,
            task_id,
            title,
            detail,
            start_time,
            end_time,
            target_date,
            status,
            priority,
            elapsed_time
        FROM schedule_tasks
        WHERE schedule_id = ?1
        ",
    )
    .map_err(|e| format!("prepare tasks error: {}", e))?;

  let rows = stmt
    .query_map(params![schedule_id], |row| {
      Ok(ScheduleTask {
        id: row.get(0)?,
        schedule_id: row.get(1)?,
        task_id: row.get(2)?,
        title: row.get(3)?,
        detail: row.get(4)?,
        target_task_id: None,
        starttime: row.get(5)?,
        endtime: row.get(6)?,
        targetdate: row.get(7)?,
        status: row.get(8)?,
        priority: row.get(9)?,
        elapsed_time: row.get(10)?,
        dependencies: None,
      })
    })
    .map_err(|e| format!("query tasks error: {}", e))?;

  let mut tasks = Vec::new();

  for r in rows {
    tasks.push(r.map_err(|e| format!("task row error: {}", e))?);
  }

  Ok(Schedule { tasks, ..schedule })
}

#[tauri::command]
pub fn get_schedule_detail_list() -> Result<Vec<Schedule>, String> {
  let conn = get_conn()?;

  let mut stmt = conn
    .prepare(
      "
        SELECT id, title, description, created_at, updated_at
        FROM schedules
        ORDER BY created_at DESC
        ",
    )
    .map_err(|e| format!("prepare schedule list error: {}", e))?;

  let schedule_rows = stmt
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
    .map_err(|e| format!("schedule list query error: {}", e))?;

  let mut schedules: Vec<Schedule> = Vec::new();

  for r in schedule_rows {
    let mut schedule = r.map_err(|e| format!("schedule row error: {}", e))?;

    let mut task_stmt = conn
      .prepare(
        "
          SELECT
              id,
              schedule_id,
              task_id,
              title,
              detail,
              start_time,
              end_time,
              target_date,
              status,
              priority,
              elapsed_time
          FROM schedule_tasks
          WHERE schedule_id = ?1
          ",
      )
      .map_err(|e| format!("prepare task error: {}", e))?;

    let task_rows = task_stmt
      .query_map(params![schedule.id], |row| {
        Ok(ScheduleTask {
          id: row.get(0)?,
          schedule_id: row.get(1)?,
          task_id: row.get(2)?,
          title: row.get(3)?,
          detail: row.get(4)?,
          target_task_id: None,
          starttime: row.get(5)?,
          endtime: row.get(6)?,
          targetdate: row.get(7)?,
          status: row.get(8)?,
          priority: row.get(9)?,
          elapsed_time: row.get(10)?,
          dependencies: None,
        })
      })
      .map_err(|e| format!("query task error: {}", e))?;

    let mut tasks = Vec::new();

    for t in task_rows {
      tasks.push(t.map_err(|e| format!("task row error: {}", e))?);
    }

    schedule.tasks = tasks;

    schedules.push(schedule);
  }

  Ok(schedules)
}
