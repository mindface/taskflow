use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Scheduele {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tasks: Vec<SchedueleTasks>, // タスクのリスト
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SchedueleTasks {
    pub id: i64,
    pub title: String,
    pub detail: String,
    pub starttime: DateTime<Utc>,
    pub endtime: DateTime<Utc>,
    pub targetdate: NaiveDate,
    pub status: String, // 例: "未着手", "進行中", "完了"
    pub priority: Option<u8>, // 優先度 (1が最優先)
    pub elapsed_time: Option<f64>, // 費やした時間 (単位: 時間)
    pub dependencies: Option<Vec<i64>>, // 他のタスクへの依存関係
}
