import { invoke } from "@tauri-apps/api/core"
import { Schedule } from "../../models/Schedule"
import ScheduleDialog from "./ScheduleDialog";
import { useScheduleWindowSync } from "../../hooks/useSchedlueWindowSync"

type ViewButtons = {
  dialog?: boolean
  update?: boolean
  delete?: boolean
  view?: boolean
}

type Props = {
  schedule: Schedule;
  loadSchedules: () => void
  setScheduleAction: (schedule:Schedule) => void
  viewBtons?: ViewButtons;
}

export default function ScheduleItem({ 
  schedule,
  loadSchedules,
  setScheduleAction,
  viewBtons = { dialog: true, update: true, delete: true, view: true }
}: Props) {
  const { syncScheduleContent, openScheduleWindow } = useScheduleWindowSync();

  const viewAction = async () => {
    syncScheduleContent(schedule);
    await openScheduleWindow(true);
  }

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
        {viewBtons?.dialog && <ScheduleDialog schedule={schedule} />}
        {viewBtons?.update && (
          <button
            className="btn"
            onClick={() => setScheduleAction(schedule)}
          >
            update
          </button>
        )}
        {viewBtons?.delete && (
          <button
            className="btn "
            onClick={() => deleteSchedule(schedule.id)}
          >
            delete
          </button>
        )}
        {viewBtons?.view && (
          <button
            className="btn"
            onClick={viewAction}
          >
            view
          </button>
        )}
      </div>
    </div>
  );
}