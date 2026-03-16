import { forwardRef, useImperativeHandle, useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Schedule } from "../models/Schedule"
import ScheduleItem from "./modifier/ScheduleItem";

export interface ScheduleListHandle {
  loadSchedules: () => void;
}

type Props = {
  setScheduleAction: (schedule:Schedule) => void
}

const ScheduleList = forwardRef<ScheduleListHandle,Props>(({ setScheduleAction },ref) => {
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const loadSchedules = async () => {
    const result = await invoke<Schedule[]>("get_schedule_detail_list")
    setSchedules(result)
  }

  useImperativeHandle(ref, () => ({
    loadSchedules() {
      loadSchedules();
    },
  }));

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
            setScheduleAction={(schedule: Schedule) => {setScheduleAction(schedule)}}
          />
        </div>
      ))}
    </div>
  )
})

export default ScheduleList;