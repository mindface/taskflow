import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { inputCheckered } from "../utils/inputCheckered";
import { Schedule, ScheduleTask } from "../models/Schedule"
import ScheduleTaskItem from "./modifier/ScheduleTaskItem";

type Props = {
  stateSchedule?: Schedule;
  loadListSchedule: () => void
}

export default function ScheduleForm({ stateSchedule, loadListSchedule }: Props) {
  const { inputDateCheaker } = inputCheckered()
  const [makeSwitcher, setMakeSwitcher] = useState(false)
  const [scheduleId, setScheduleId] = useState<number | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [createTime, setCreateTime] = useState("")
  const [updateTime, setUpdateTime] = useState("")

  const [tasks, setTasks] = useState<ScheduleTask[]>([])

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDetail, setTaskDetail] = useState("")
  const [taskStart, setTaskStart] = useState("")
  const [taskEnd, setTaskEnd] = useState("")
  const [taskDate, setTaskDate] = useState("")

  useEffect(() => {
    if(stateSchedule) {
      switchHander(true)
      setFromHandler(stateSchedule)
      loadListSchedule()
    } else {
      resetFromHandler()
    }
  },[stateSchedule])

  const setFromHandler = (item: Schedule) => {
    setScheduleId(item.id)
    setTitle(item.title)
    setDescription(item.description)
    setCreateTime(item.created_at)
    setUpdateTime(item.updated_at)
    setTasks(item.tasks)
  }

  const resetFromHandler = (type?: string) => {
    if(type !== "task") {
      setTitle("")
      setDescription("")
      setTasks([])
    }
    setTaskTitle("")
    setTaskDetail("")
    setTaskStart("")
    setTaskEnd("")
    setTaskDate("")
  }

  const addTask = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newTask: ScheduleTask = {
      schedule_id: scheduleId || 0,
      task_id: 0,
      title: taskTitle,
      detail: taskDetail,
      starttime: taskStart,
      endtime: taskEnd,
      targetdate: taskDate,
      status: "",
      priority: "",
      elapsedtime: "",
    }
    const taskStartCheck = inputDateCheaker(taskStart)
    const taskEndCheck = inputDateCheaker(taskEnd)
    if(!taskStartCheck || !taskEndCheck) return

    setTasks([...tasks, newTask])

    resetFromHandler("task")
  }

  const switchHander = (switchValue: boolean) => {
    setMakeSwitcher(switchValue)
    resetFromHandler()
  }

  const updateSetHandler = async () => {
    if (scheduleId == null) {
      console.error("scheduleId not set")
      return
    }
    try {
      await invoke("update_list_schedule_task", {
        id: scheduleId,
        title,
        description,
        tasks: tasks.map(t => ({
          task_id: 0,
          title: t.title,
          detail: t.detail,
          starttime: t.starttime,
          endtime: t.endtime,
          targetdate: t.targetdate
        }))
      })
      console.log("update success")

    } catch (error) {
      console.error(error)
      throw("update schedule error")
    }
  }

  const addSetHandler = async () => {
    try {
      const scheduleId = await invoke<number>("add_schedule", {
        title,
        description,
        createTime,
        updateTime
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

    } catch (error) {
      console.error(error)
      throw("create schedule error")
    }
  }

  const removeTask = (index:number) => {
    const newTasks = tasks.filter((_,i)=> i !== index)
    setTasks(newTasks)
  }

  const submit = async () => {
    try {
      if(makeSwitcher) {
        await updateSetHandler()
      } else {
        await addSetHandler()
      }
      loadListSchedule()
    } catch (e) {
      // TODO throwの調整をする
      console.error(e)
    }
  }

  return (
    <div className="mb-4 p-4 border rounded space-y-4">
      <div className="form-header pb-4">
        { makeSwitcher ? <button
          className="btn"
          onClick={() => {
            switchHander(false)
          }}
        >
          新規で作成する
        </button> : <>更新する場合はタスクリストから表示</>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!e.currentTarget.checkValidity()) {
            alert("入力が正しくありません");
            return;
          }
          (async () => {
            await submit();
          })()
        }}
      >
        <h2 className="pb-4 text-xl font-bold">
          Create Schedule Model
        </h2>
        <div className="pb-2">
          <input
            className="border p-2 w-full"
            placeholder="title"
            value={title}
            required
            onChange={(e)=>setTitle(e.target.value)}
          />
        </div>

        <div className="pb-2">
          <textarea
            className="border p-2 w-full"
            placeholder="description"
            value={description}
            required
            onChange={(e)=>setDescription(e.target.value)}
          />
        </div>

        <div className="pb-2 flex gap-2">
          <div className="create_day">
            作成 : {createTime}
          </div>
          <div className="create_day">
            更新 : {updateTime}
          </div>
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
              <div className="input-box">
                開始 : 
                <input
                  type="datetime-local"
                  className="border p-2"
                  value={taskStart}
                  onChange={(e)=>setTaskStart(e.target.value)}
                />
              </div>

              <div className="input-box">
                終了 : 
                <input
                  type="datetime-local"
                  className="border p-2"
                  value={taskEnd}
                  onChange={(e)=>setTaskEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="pb-4 flex gap-2">
              <input
                type="date"
                className="border p-2"
                value={taskDate}
                onChange={(e)=>setTaskDate(e.target.value)}
              />
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {addTask(e)}}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                add task
              </button>
            </div>
          </div>

        <div className="mb-4 p-4 border rounded">
          {tasks.map((task,index)=>(
            <ScheduleTaskItem
              key={index}
              task={task}
              itemNumber={index}
              removeTask={(index) => removeTask(index)}
            />
          ))}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          { makeSwitcher ? <>update schedule</> : <>create schedule</> }
        </button>
      </form>

    </div>
  )
}