import ScheduleForm from "./ScheduleForm";
import ScheduleList from "./ScheduleList";

export default function Scheduler() {

  const reload = () => {
    window.location.reload()
  }

  return (
    <div className="p-4 border rounded space-y-2">
      <ScheduleForm reload={reload} />
      <ScheduleList />
    </div>
  )
}