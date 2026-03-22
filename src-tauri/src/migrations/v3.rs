use rusqlite::Connection;

pub fn up(conn: &Connection) -> Result<(), String> {

    conn.execute_batch(
        "
        ALTER TABLE schedule_tasks
        ADD COLUMN run_starttime INTEGER;
        ",
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}