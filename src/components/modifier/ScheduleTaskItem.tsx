import { ScheduleTask } from "../../models/Schedule"
import { formatDateTime } from "../../utils/dayApi";

type Props = {
  task: ScheduleTask;
  itemNumber: number;
  removeTask: (index:number) => void
}

export default function ScheduleTaskItem({ 
  task,
  itemNumber,
  removeTask
}: Props) {

  return (
    <div className="schedule-task-item flex justify-between mb-4 p-2 border rounded">
      <div>
        <p className="font-bold pb-4">{task.title}</p>
        <div className="flex">
          <p>開始日 | {formatDateTime(task.starttime,"YYYY/MM/DD HH:mm:ss")}</p>
          <p>終了日 | {formatDateTime(task.endtime,"YYYY/MM/DD HH:mm:ss")}</p>
        </div>
      </div>
      <div className="actions flex gap-2">
        <button
          onClick={()=>removeTask(itemNumber)}
          className="btn h-8"
        >
          delete
        </button>
        <details className="relative inline-block">
          <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 -top-10 
                       bg-black text-white text-xs p-4 px-2 py-1 rounded whitespace-nowrap opacity-0 
                       group-hover:opacity-100 transition-opacity duration-200">
          クリックすると内容が開きます
          {/* 矢印部分 */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></span>
          </span>
          <summary className="cursor-pointer list-none p-2 border border-color-blue-500 text-blue-500 rounded hover:bg-blue-600 focus:outline-none select-none">
            詳細の情報を開く ▼
          </summary>
          <div className="absolute right-0 mt-2 w-48 p-4 bg-white border border-gray-200 rounded-md shadow-xl z-50">
            <p className="p-2 text-sm text-gray-700">
              {task.detail}
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}