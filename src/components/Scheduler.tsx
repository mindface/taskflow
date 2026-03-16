import { useState, useRef } from "react";
import ScheduleForm from "./ScheduleForm";
import ScheduleList from "./ScheduleList";
import type { ScheduleListHandle } from "./ScheduleList";
import { Schedule } from "../models/Schedule"

export default function Scheduler() {
  const [stateSchedule,setStateSchedule] = useState<Schedule>();
  const scheduleListRef = useRef<ScheduleListHandle>(null);

  return (
    <div className="p-4 border rounded space-y-2">
      <ScheduleForm
        stateSchedule={stateSchedule}
        loadListSchedule={() => {
          if(scheduleListRef.current) {
            scheduleListRef.current.loadSchedules()
          }
        }}
      />
      <ScheduleList
        ref={scheduleListRef}
        setScheduleAction={(schedule: Schedule) => {
          setStateSchedule(schedule)
        }}
      />
    </div>
  )
}