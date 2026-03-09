import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ScheduleForm from "./ScheduleForm";
import ScheduleList from "./ScheduleList";
import { Schedule } from "../models/Schedule"

type Props = {
}

export default function ScheduleDetail({  }: Props) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)

  useEffect(() => {
    loadSchedule()
  }, [])

  const reload = () => {
    window.location.reload()
  }

  const loadSchedule = async () => {
    try {
      const result = await invoke<Schedule>("get_schedule_detail_list")
      console.log(result)
      setSchedule(result)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-4 border rounded space-y-2">
      {schedule ? <div className="view-scdlue">
        <h2 className="pb-4 text-xl font-bold">
          {schedule.title}
        </h2>
        <p className="pb-4">
          {schedule.description}
        </p>
        <div className="pb-4 text-xs text-gray-500">
          created : {schedule.created_at}
        </div>
        <div className="pb-4 text-xs text-gray-500">
          updated : {schedule.updated_at}
        </div>
      </div> : <>node data</>}

      <ScheduleForm reload={reload} />
      <ScheduleList />

    </div>
  )
}