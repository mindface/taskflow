use rusqlite::Connection;
use crate::db::db_core::get_conn;

#[tauri::command]
pub fn init_db() -> Result<String, String> {
  let conn = get_conn()?;
  conn
    .execute_batch(
      "BEGIN;

        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            infolink TEXT,
            tag TEXT NOT NULL
            -- created_at/updated_at handled by migration
        );

        CREATE TABLE IF NOT EXISTS concept_process_factors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            infolink TEXT
            -- created_at/updated_at handled by migration
        );

        CREATE TABLE IF NOT EXISTS concept_relations (
            from_concept_id INTEGER NOT NULL,
            to_concept_id INTEGER NOT NULL,
            relation_type TEXT NOT NULL,
            PRIMARY KEY (from_concept_id, to_concept_id, relation_type)
        );

        CREATE TABLE IF NOT EXISTS note_concepts (
            note_id INTEGER NOT NULL,
            concept_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            PRIMARY KEY (note_id, concept_id, role)
        );

        COMMIT;",
    )
    .map_err(|e| format!("DB init error: {}", e))?;
  Ok("initialized".into())
}


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

