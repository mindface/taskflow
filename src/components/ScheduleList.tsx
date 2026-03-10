import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Schedule } from "../models/Schedule"
import ScheduleItem from "./modifier/ScheduleItem";

export default function ScheduleList() {
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const loadSchedules = async () => {
    const result = await invoke<Schedule[]>("get_schedule_detail_list")
    setSchedules(result)
  }

  useEffect(() => {
    loadSchedules()
  }, [])

  return (
    <div className="space-y-2">
      <h2 className="pb-4 text-xl font-bold">
        Schedule List
      </h2>
      {schedules.map(schedule => (
        <div
          key={schedule.id}
          className="mb-4 p-3 border  rounded"
        >
          <ScheduleItem
            loadSchedules={loadSchedules}
            schedule={schedule}
          />
        </div>
      ))}
    </div>
  )
}