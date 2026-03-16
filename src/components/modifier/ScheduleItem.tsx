import { invoke } from "@tauri-apps/api/core"
import { Schedule } from "../../models/Schedule"
import ScheduleDialog from "./ScheduleDialog";

type Props = {
  schedule: Schedule;
  loadSchedules: () => void
  setScheduleAction: (schedule:Schedule) => void
}

export default function ScheduleItem({ 
  schedule,
  loadSchedules,
  setScheduleAction
}: Props) {

  const deleteSchedule = async (id: number) => {
    if (!confirm("delete schedule?")) return
    await invoke("delete_schedule", {
      id: id
    })
    loadSchedules();
  }

  return (
    <div className="p-8 space-y-4 max-w-md">
      <h3 className="pb-2">model schedule | {schedule.title}</h3>
      <div className="flex gap-2">
        <button
          className="btn"
          onClick={() => setScheduleAction(schedule)}
        >
          update
        </button>
        <button
          className="btn"
          onClick={() => deleteSchedule(schedule.id)}
        >delete</button>
        <ScheduleDialog schedule={schedule} />
      </div>
    </div>
  );
}