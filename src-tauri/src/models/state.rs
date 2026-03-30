use crate::models::schedule::Schedule;
use serde::{Serialize};

#[derive(Default)]
pub struct PreviewState {
  pub content: String,
  pub title: String,
}

#[derive(Serialize, Debug, Clone, Default)]
pub struct ScheduleState {
  pub schedule: Schedule,
}

