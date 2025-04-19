use std::path::PathBuf;
use sqlx::SqlitePool;
use chrono::{DateTime, Utc, NaiveDateTime};
use serde_json::json;

pub async fn collect_browser_history(pool: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    sqlx::query!(
        r#"
        CREATE TABLE IF NOT EXISTS browser_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            browser TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT,
            visit_time DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await?;
    // Chrome履歴の収集
    if let Some(chrome_path) = get_chrome_history_path() {
        collect_chrome_history(pool, &chrome_path).await?;
    }

    // Firefox履歴の収集
    if let Some(firefox_path) = get_firefox_history_path() {
        collect_firefox_history(pool, &firefox_path).await?;
    }

    // Safari履歴の収集
    if let Some(safari_path) = get_safari_history_path() {
        collect_safari_history(pool, &safari_path).await?;
    }

    Ok(())
}

fn get_chrome_history_path() -> Option<PathBuf> {
    let home_dir = dirs::home_dir()?;
    Some(home_dir.join("Library/Application Support/Google/Chrome/Default/History"))
}

fn get_firefox_history_path() -> Option<PathBuf> {
    let home_dir = dirs::home_dir()?;
    Some(home_dir.join("Library/Application Support/Firefox/Profiles"))
}

fn get_safari_history_path() -> Option<PathBuf> {
    let home_dir = dirs::home_dir()?;
    Some(home_dir.join("Library/Safari/History.db"))
}

fn chrome_time_to_datetime(chrome_time: i64) -> chrono::NaiveDateTime {
    // Chromeは1601年からのマイクロ秒として記録
    let unix_time = (chrome_time / 10_000) - 11_644_473_600_000;
    chrono::NaiveDateTime::from_timestamp_opt(unix_time / 1000, 0).unwrap_or_else(|| chrono::NaiveDateTime::from_timestamp(0, 0))
}

async fn collect_chrome_history(pool: &SqlitePool, path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    // Chrome履歴の収集ロジック
    // SQLiteデータベースから履歴を読み取る
    let conn = sqlx::sqlite::SqlitePoolOptions::new()
    .max_connections(1)
    .connect_with(
        sqlx::sqlite::SqliteConnectOptions::new()
            .filename(path)
            .read_only(true)
    )
    .await?;

// Chromeの履歴テーブルからデータを取得
    let rows= sqlx::query!(
        r#"
        SELECT url, title, last_visit_time
        FROM urls
        ORDER BY last_visit_time DESC
        "#
    )
    .fetch_all(&conn)
    .await?;

    for row in rows {
        let visit_time = chrome_time_to_datetime(row.last_visit_time);
        
        sqlx::query!(
            r#"
            INSERT INTO browser_history (browser, url, title, visit_time)
            VALUES (?, ?, ?, ?)
            "#,
            "chrome",
            row.url,
            row.title,
            visit_time
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn collect_firefox_history(pool: &SqlitePool, path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    // Firefox履歴の収集ロジック
    let conn = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            sqlx::sqlite::SqliteConnectOptions::new()
                .filename(path)
                .read_only(true)
        )
        .await?;

    // Safariの履歴テーブルからデータを取得
    let rows= sqlx::query!(
        r#"
        SELECT url, title, visit_time
        FROM history_items
        ORDER BY visit_time DESC
        "#
    )
    .fetch_all(&conn)
    .await?;

    for row in rows {
        sqlx::query!(
            r#"
            INSERT INTO browser_history (browser, url, title, visit_time)
            VALUES (?, ?, ?, ?)
            "#,
            "safari",
            row.url,
            row.title,
            row.visit_time
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

fn safari_time_to_datetime(safari_time: f64) -> chrono::NaiveDateTime {
    // Safari は Mac epoch (2001-01-01) からの秒
    let base_time = chrono::NaiveDate::from_ymd_opt(2001, 1, 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap();
    base_time + chrono::Duration::seconds(safari_time as i64)
}

async fn collect_safari_history(pool: &SqlitePool, path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    // Safari履歴の収集ロジック
    let history_pool = SqlitePool::connect(&format!("sqlite://{}", path.display())).await?;

    let rows= sqlx::query!(
        r#"
        SELECT history_items.url, history_items.title, history_visits.visit_time
        FROM history_items
        JOIN history_visits ON history_items.id = history_visits.history_item
        ORDER BY history_visits.visit_time DESC
        LIMIT 100
        "#
    )
    .fetch_all(&history_pool)
    .await?;

    for row in rows {
        let url = row.url;
        let title = row.title.unwrap_or_default();
        let visit_time = safari_time_to_datetime(row.visit_time);

        sqlx::query!(
            r#"
            INSERT INTO browser_history (browser, url, title, visit_time)
            VALUES (?, ?, ?, ?)
            "#,
            "safari",
            url,
            title,
            visit_time
        )
        .execute(pool)
        .await?;
    }
    Ok(())
} 