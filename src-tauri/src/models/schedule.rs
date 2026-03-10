use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Debug, Clone)]
pub struct Schedule {
  pub id: i64,
  pub title: String,
  pub description: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub tasks: Vec<ScheduleTask>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ScheduleTask {
  pub id: i64,
  pub schedule_id: i64,

  pub task_id: i64,

  pub title: String,
  pub detail: String,

  pub target_task_id: Option<String>,

  pub starttime: Option<String>,
  pub endtime: Option<String>,
  pub targetdate: Option<String>,

  pub status: String,

  pub priority: Option<u8>,

  pub elapsed_time: Option<f64>,

  pub dependencies: Option<Vec<i64>>,
}
