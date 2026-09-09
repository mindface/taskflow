use rusqlite::Connection;

pub fn up(conn: &Connection) -> Result<(), String> {
  conn
    .execute_batch(
      "
        ALTER TABLE users
        ADD COLUMN turso_database_url TEXT;

        ALTER TABLE users
        ADD COLUMN turso_auth_token TEXT;
        ",
    )
    .map_err(|e| e.to_string())?;

  Ok(())
}
