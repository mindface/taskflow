import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"

type Props = {
  reload: () => void
}

type Task = {
  title: string
  detail: string
  starttime: string
  endtime: string
  targetdate: string
}

export default function ScheduleForm({ reload }: Props) {

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const [tasks, setTasks] = useState<Task[]>([])

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDetail, setTaskDetail] = useState("")
  const [taskStart, setTaskStart] = useState("")
  const [taskEnd, setTaskEnd] = useState("")
  const [taskDate, setTaskDate] = useState("")

  const addTask = () => {
    const newTask: Task = {
      title: taskTitle,
      detail: taskDetail,
      starttime: taskStart,
      endtime: taskEnd,
      targetdate: taskDate
    }

    setTasks([...tasks, newTask])

    setTaskTitle("")
    setTaskDetail("")
    setTaskStart("")
    setTaskEnd("")
    setTaskDate("")
  }

  const removeTask = (index:number) => {
    const newTasks = tasks.filter((_,i)=> i !== index)
    setTasks(newTasks)
  }

  const submit = async () => {
    try {

      const scheduleId = await invoke<number>("add_schedule", {
        title,
        description,
        startTime,
        endTime
      })

      for (const task of tasks) {
        await invoke("add_schedule_task", {
          scheduleId,
          taskId: 0,
          title: task.title,
          detail: task.detail,
          starttime: task.starttime,
          endtime: task.endtime,
          targetdate: task.targetdate
        })
      }

      reload()

    } catch (error) {
      console.error("create schedule error", error)
    }

    setTitle("")
    setDescription("")
    setStartTime("")
    setEndTime("")
    setTasks([])
  }

  return (
    <div className="mb-4 p-4 border rounded space-y-4">
      <h2 className="pb-4 text-xl font-bold">
        Create Schedule Model
      </h2>
      <div className="pb-2">
        <input
          className="border p-2 w-full"
          placeholder="title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
        />
      </div>
      <div className="pb-2">
        <textarea
          className="border p-2 w-full"
          placeholder="description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />
      </div>
      <div className="pb-2 flex gap-2">
        <input
          type="datetime-local"
          className="border p-2"
          value={startTime}
          onChange={(e)=>setStartTime(e.target.value)}
        />

        <input
          type="datetime-local"
          className="border p-2"
          value={endTime}
          onChange={(e)=>setEndTime(e.target.value)}
        />
      </div>

      <hr/>

      <div className="p-4">
          <h3 className="pb-4 font-bold">
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
              value={taskStart}
              onChange={(e)=>setTaskStart(e.target.value)}
            />

            <input
              type="datetime-local"
              className="border p-2"
              value={taskEnd}
              onChange={(e)=>setTaskEnd(e.target.value)}
            />
          </div>

          <input
            type="date"
            className="border p-2"
            value={taskDate}
            onChange={(e)=>setTaskDate(e.target.value)}
          />

          <button
            onClick={addTask}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            add task
          </button>
      </div>


      <div className="space-y-2">
        {tasks.map((task,index)=>(
          <div
            key={index}
            className="border p-2 flex justify-between"
          >
            <div>
              <p className="font-bold">{task.title}</p>
              <p>{task.targetdate}</p>
            </div>
            <button
              onClick={()=>removeTask(index)}
              className="text-red-500"
            >
              delete
            </button>
          </div>
        ))}
      </div>


      <button
        onClick={submit}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        create schedule
      </button>

    </div>
  )
}