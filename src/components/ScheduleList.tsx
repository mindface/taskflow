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

  const deleteSchedule = async (id: number) => {
    if (!confirm("delete schedule?")) return
    await invoke("delete_schedule", {
      scheduleId: id
    })
    loadSchedules()
  }

  return (
    <div className="space-y-2">
      {schedules.map(schedule => (
        <div
          key={schedule.id}
          className="border p-3 rounded flex justify-between"
        >
          <ScheduleItem
            schedule={schedule}
          />
        </div>

      ))}

    </div>
  )
}