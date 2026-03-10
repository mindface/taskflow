
export type Schedule = {
  id: number
  title: string
  description: string
  start_time: string
  end_time: string
  tasks: ScheduleTask[];
  created_at: string
  updated_at: string
}

export type ScheduleTask = {
  task_id: number
  title: string
  detail: string
  starttime: string
  endtime: string
  targetdate: string
}
