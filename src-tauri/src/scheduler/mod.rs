// use tokio::time::{sleep, Duration};
// use crate::database::Database;
// use crate::data_collection;
// use std::error::Error;
// use anyhow::Result;

// pub struct Scheduler {
//     interval: Duration,
// }

// impl Scheduler {
//     pub fn new(interval_minutes: u64) -> Self {
//         Self {
//             interval: Duration::from_secs(interval_minutes * 60),
//         }
//     }

//     pub async fn start(&self) -> Result<()> {
//         loop {
//             if let Ok(db) = Database::new().await {
//                 let pool = db.get_pool();
//                 if let Err(e) = data_collection::collect_history(pool).await {
//                     eprintln!("Error collecting history: {}", e);
//                 }
//             }
//             sleep(self.interval).await;
//         }
//     }
// } 