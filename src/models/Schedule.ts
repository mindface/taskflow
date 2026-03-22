
export type Schedule = {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  tasks: ScheduleTask[];
  created_at: string;
  updated_at: string;
}

export type ScheduleTask = {
  id: number;
  schedule_id: number;
  task_id: number;
  title: string;
  detail: string;
  starttime: string;
  endtime: string;
  run_starttime?: number;
  run_endtime?: number;
  targetdate: string;
  status: string;
  priority: string;
  elapsed_time: number;
}
