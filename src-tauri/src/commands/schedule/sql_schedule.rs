use crate::commands::db_core::get_conn;
use crate::models::schedule::{Schedule, ScheduleTask};

#[tauri::command]
pub fn init_schedule_db() -> Result<String, String> {
  let conn = get_conn()?;

  conn
    .execute_batch(
      "
        BEGIN;

        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS schedule_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            schedule_id INTEGER NOT NULL,

            task_id INTEGER,

            title TEXT NOT NULL,
            detail TEXT,

            target_task_id TEXT,

            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,

            target_date TEXT NOT NULL,

            status TEXT NOT NULL DEFAULT '未着手',

            priority INTEGER,

            elapsed_time REAL,

            FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
        );

        COMMIT;
        ",
    )
    .map_err(|e| format!("schedule db init error: {}", e))?;

  Ok("schedule db initialized".into())
}
