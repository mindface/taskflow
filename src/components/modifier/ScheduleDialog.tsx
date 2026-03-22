import { useState } from "react";
import { Schedule } from "../../models/Schedule"
import CoreDialog from "../core/CoreDialog";
import { formatDateTime } from "../../utils/dayApi";
import { invoke } from "@tauri-apps/api/core";

type Props = {
  schedule: Schedule;
}

export default function ScheduleDialog({ schedule }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const dialogHandler = () => {
    setIsOpen(!isOpen);
  };

  const startTaskAction = async (id: number) => {
    await invoke("update_start_task", { scheduleTaskId: id })
  }
  const endTaskAction = async (id: number) => {
    await invoke("update_end_task", { scheduleTaskId: id })
  }
  return (
    <div className="schedule-dialog">
      <button
        onClick={dialogHandler}
        className="px-1"
      >
        view
      </button>
      <CoreDialog
        isOpen={isOpen}
        title="schedule task dialog"
        onClose={dialogHandler}
      >
        <div className="p-4">
          <div className="pb-4">{schedule.title}</div>
          {schedule.tasks.map((item,index) => 
            <div key={`schedule-task-item-${index}`} className="task-item mb-4 p-4 border rounded space-y-4">
              <div className="mb-4 pb-2 border-b-2">{item.title}</div>
              <div className="mb-4 pb-4 border-b-1">
                <p className="pb-2 text-xs text-gray-400">詳細</p>
                <div className="text p-2">{item.detail}</div>
              </div>
              <div className="flex">
                <div className="p-2">開始: {formatDateTime(item.starttime,"YYYY/MM/DD HH:mm:ss")}</div>
                <div className="p-2">終了: {formatDateTime(item.endtime,"YYYY/MM/DD HH:mm:ss")}</div>
              </div>
              <div className="actions flex gap-2">
                <button
                  onClick={() => startTaskAction(item.id)}
                  className="btn">start
                </button>
                <button
                  onClick={() => endTaskAction(item.id)}
                  className="btn">end
                </button>
              </div>
            </div>
            )}
        </div>
      </CoreDialog>
    </div>
  );
}