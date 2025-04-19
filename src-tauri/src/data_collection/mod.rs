use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub timestamp: DateTime<Utc>,
    pub content: String,
    pub source: String,
    pub metadata: serde_json::Value,
}

pub mod browser_history;
pub mod app_history;
pub mod system_logs;

pub async fn collect_history(pool: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    // ブラウザ履歴の収集
    browser_history::collect_browser_history(pool).await?;
    
    // アプリ履歴の収集
    app_history::collect_app_history(pool).await?;

    // システムログの収集
    system_logs::collect_system_logs(pool).await?;
    
    Ok(())
}