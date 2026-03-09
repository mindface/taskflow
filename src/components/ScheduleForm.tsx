import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"

type Props = {
  reload: () => void
}

export default function ScheduleForm({ reload }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDetail, setTaskDetail] = useState("")

  const [starttime, setStarttime] = useState("")
  const [endtime, setEndtime] = useState("")
  const [targetdate, setTargetdate] = useState("")

  const submit = async () => {
    try {
       const scheduleId = await invoke("add_schedule", {
        title,
        description,
        startTime,
        endTime
      })

      await invoke("add_schedule_task", {
        scheduleId: scheduleId,
        taskId: 0,
        title: taskTitle,
        detail: taskDetail,
        starttime: starttime,
        endtime: endtime,
        targetdate: targetdate
      })
    } catch (error) {
      console.error("create_schedule ??");
    }

    setTitle("")
    setDescription("")
    setStartTime("")
    setEndTime("")

    // reload()
  }

  return (
    <div className="p-4 border rounded space-y-2">
        <h3 className="font-bold pb-4">
          schedule model01
        </h3>
      <p className="pb-4">
        <input
          className="border p-2 w-full"
          placeholder="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </p>
      <p className="pb-4">
        <textarea
          className="border p-2 w-full"
          placeholder="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </p>
      <div className="flex gap-2">
        <div className="pb-4">
          <input
            type="datetime-local"
            className="border p-2"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <input
            type="datetime-local"
            className="border p-2"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
      <div className="make-task">
        <h3 className="font-bold pb-4">
          Task
        </h3>
        <div className="pb-4">
          <input
            className="border p-2 w-full"
            placeholder="task title"
            value={taskTitle}
            onChange={(e)=>setTaskTitle(e.target.value)}
          />
        </div>
        <div className="pb-4">
          <textarea
            className="border p-2 w-full"
            placeholder="task detail"
            value={taskDetail}
            onChange={(e)=>setTaskDetail(e.target.value)}
          />
        </div>
        <div className="pb-4 flex gap-2">
          <input
            type="datetime-local"
            className="border p-2"
            value={starttime}
            onChange={(e)=>setStarttime(e.target.value)}
          />
          <input
            type="datetime-local"
            className="border p-2"
            value={endtime}
            onChange={(e)=>setEndtime(e.target.value)}
          />
        </div>
        <div className="pb-4">
          <input
            type="date"
            className="border p-2"
            value={targetdate}
            onChange={(e)=>setTargetdate(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={submit}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        add schedule
      </button>

    </div>
  )
}