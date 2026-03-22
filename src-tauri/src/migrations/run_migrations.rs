use crate::db::db_core::get_conn;
use rusqlite::Connection;
// use crate::migrations::v3;
// use crate::migrations::v4;

pub fn run_migrations() -> Result<(), String> {
  let conn = get_conn()?;

  let version = get_version(&conn)?;

  if version < 1 {
    migration_v1(&conn)?;
    set_version(&conn, 1)?;
  }

  if version < 2 {
    migration_v2(&conn)?;
    set_version(&conn, 2)?;
  }

  // if version < 3 {
  //   v3::up(&conn)?;
  //   set_version(&conn, 3)?;
  // }

  // if version < 4 {
  //   v4::up(&conn)?;
  //   set_version(&conn, 4)?;
  // }

  Ok(())
}

fn get_version(conn: &Connection) -> Result<i32, String> {
  let mut stmt = conn
    .prepare("SELECT version FROM schema_version LIMIT 1")
    .map_err(|e| e.to_string())?;

  let result = stmt.query_row([], |row| row.get(0));

  match result {
    Ok(v) => Ok(v),
    Err(_) => {
      conn
        .execute("INSERT INTO schema_version (version) VALUES (0)", [])
        .map_err(|e| e.to_string())?;

      Ok(0)
    }
  }
}

fn set_version(conn: &Connection, v: i32) -> Result<(), String> {
  conn
    .execute("UPDATE schema_version SET version = ?", [v])
    .map_err(|e| e.to_string())?;
  Ok(())
}

fn migration_v1(conn: &Connection) -> Result<(), String> {
  conn
    .execute_batch(
      "
        ALTER TABLE schedule_tasks
        ADD COLUMN run_starttime INTEGER;
        ",
    )
    .map_err(|e| e.to_string())?;

  Ok(())
}

fn migration_v2(conn: &Connection) -> Result<(), String> {
  conn
    .execute_batch(
      "
        ALTER TABLE schedule_tasks
        ADD COLUMN run_endtime INTEGER;
        ",
    )
    .map_err(|e| e.to_string())?;

  Ok(())
}
