import { useEffect, useState } from "react";
import { Schedule } from "../../models/Schedule"
import CoreDialog from "../core/CoreDialog";
import { formatDateTime, formatUnixDateTime } from "../../utils/dayApi";
import { invoke } from "@tauri-apps/api/core";


type Props = {
  schedule: Schedule;
}

export default function ScheduleDialog({ schedule }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scheduleData, setScheduleData] = useState<Schedule>();

  useEffect(() => {
    setScheduleData(schedule)
  },[])

  const dialogHandler = () => {
    setIsOpen(!isOpen);
  };

  const loadSchedule = async () => {
    if(scheduleData) {
      console.log(scheduleData)
      const res = await invoke("get_schedule_detail", { scheduleid: scheduleData.id })
      console.log("@@@@")
      console.log(res)
      // setScheduleData(res))
    }
  }

  const startTaskAction = async (id: number) => {
    await invoke("update_start_task", { scheduletaskid: id })
  }
  const endTaskAction = async (id: number) => {
    await invoke("update_end_task", { scheduletaskid: id })
  }

  const changeTime = (time: number) => {
    let reText = ""
    const h = Math.floor(time / 3600)
    if(h > 0) {
      reText+= `${h}時間`
    }
    const m = Math.floor((time % 3600) / 60)
    if(m > 0) {
      reText+= `${m}分`
    }
    const s = time % 60
    if(s > 0) {
      reText+= `${s}秒`
    }
    return reText
  };

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
        {scheduleData ? <div className="p-4">
          <div className="pb-4">{scheduleData.title}</div>
          <div className="pb-4">
            <button onClick={loadSchedule}>load</button>
          </div>
          {scheduleData.tasks.map((item,index) => 
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
                <div className="flex">
                  {item.run_starttime && formatUnixDateTime(item.run_starttime,"YYYY/MM/DD HH:mm:ss")} | 
                  <button
                    onClick={() => startTaskAction(item.id)}
                    className="btn">start
                  </button>
                </div>
                <div className="flex">
                  {item.run_endtime && formatUnixDateTime(item.run_endtime,"YYYY/MM/DD HH:mm:ss")} | 
                  <button
                    onClick={() => endTaskAction(item.id)}
                    className="btn">end
                  </button>
                </div>
              </div>
              <div className="total-time p-4">
                {changeTime(item.elapsed_time)} 時間 | 
              </div>
            </div>
            )}
        </div> : <div>loading...</div>}
      </CoreDialog>
    </div>
  );
}