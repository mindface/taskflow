use std::fs;
use std::env;
use std::path::PathBuf;
use rusqlite::Connection;
use log::info;

pub fn db_path() -> PathBuf {
    if let Ok(p) = env::var("TASKFLOW_DB_PATH") {
        return PathBuf::from(p);
    }

    if cfg!(debug_assertions) {
        let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        p.push("data");
        let _ = fs::create_dir_all(&p);
        p.push("notes-dev.db");
        return p;
    }

    let home = env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let mut p = PathBuf::from(home);
    p.push(".taskflow");
    let _ = fs::create_dir_all(&p);
    p.push("notes.db");
    p
}

// 参考(消す可能性あり)
// fn db_path() -> PathBuf {
//   // 1) 環境変数で指定があればそれを優先
//   if let Ok(p) = env::var("TASKFLOW_DB_PATH") {
//     return PathBuf::from(p);
//   }

//   // 2) 開発ビルド（debug）ならプロジェクト内 data/notes-dev.db を使う
//   if cfg!(debug_assertions) {
//     let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
//     p.push("data");
//     let _ = fs::create_dir_all(&p);
//     p.push("notes-dev.db");
//     return p;
//   }

//   // 3) 本番（release）ではユーザーのホーム配下に .taskflow/notes.db を作る
//   let home = env::var("HOME").unwrap_or_else(|_| ".".to_string());
//   let mut p = PathBuf::from(home);
//   p.push(".taskflow");
//   let _ = fs::create_dir_all(&p);
//   p.push("notes.db");
//   p
// }

pub fn get_conn() -> Result<Connection, String> {
    let path = db_path();
    info!("Opening DB at: {:?}", path);
    Connection::open(path).map_err(|e| format!("DB open error: {}", e))
}

#[tauri::command]
pub fn ensure_column(conn: &Connection, table: &str, column: &str, column_def: &str) -> Result<(), String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info('{}')", table))
        .map_err(|e| format!("prepare pragma error: {}", e))?;

    let mut exists = false;
    let rows = stmt.query_map([], |row| row.get::<usize, String>(1))
        .map_err(|e| format!("query_map pragma error: {}", e))?;
    for r in rows {
        if let Ok(name) = r {
            if name == column {
                exists = true;
                break;
            }
        }
    }

    if exists {
        return Ok(());
    }

    conn.execute(
        &format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, column_def),
        [],
    )
    .map_err(|e| format!("ALTER TABLE add column error: {}", e))?;

    info!("Added column {} to table {}", column, table);
    Ok(())
}