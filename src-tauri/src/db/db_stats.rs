use serde::Serialize;
use crate::db::db_core::{db_path, get_conn};

use crate::models::stats::{ ColumnInfo, DbInfo, TableStats };

#[tauri::command]
pub fn get_db_stats() -> Result<DbInfo, String> {
    let path = db_path();
    let conn = get_conn()?;

    // スキーマバージョンの取得
    let version: i32 = conn
        .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| row.get(0))
        .unwrap_or(0);

    let mut tables = Vec::new();
    
    let mut stmt = conn.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'sqlx_migrations' AND name NOT LIKE 'schema_version'"
    ).map_err(|e| e.to_string())?;

    let table_names = stmt.query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    for name_result in table_names {
        let name = name_result.map_err(|e| e.to_string())?;
        let count: i64 = conn.query_row(
            &format!("SELECT COUNT(*) FROM \"{}\"", name),
            [],
            |row| row.get(0)
        ).unwrap_or(0);
        
        // カラム情報の取得
        let mut col_stmt = conn.prepare(&format!("PRAGMA table_info(\"{}\")", name))
            .map_err(|e| e.to_string())?;
        
        let columns = col_stmt.query_map([], |row| {
            Ok(ColumnInfo {
                name: row.get(1)?,
                dtype: row.get(2)?,
                notnull: row.get::<_, i32>(3)? != 0,
                pk: row.get::<_, i32>(5)? != 0,
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|c| c.ok())
        .collect();
        
        tables.push(TableStats { 
            name, 
            count,
            columns,
        });
    }

    Ok(DbInfo {
        path: path.to_string_lossy().to_string(),
        status: "connected".to_string(),
        version,
        tables,
    })
}