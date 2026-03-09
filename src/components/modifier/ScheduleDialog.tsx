import { useEffect, useState } from "react";
import { Schedule } from "../../models/Schedule"
import CoreDialog from "../core/CoreDialog";

type Props = {
  schedule: Schedule;
}

export default function ScheduleDialog({ schedule }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const DialogHandler = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
  },[])

  return (
    <div className="schedule-dialog">
      <button
        onClick={DialogHandler}
        className="px-1"
      >
        view
      </button>
      <CoreDialog
        isOpen={isOpen}
        title="schedule task dialog"
        onClose={DialogHandler}
      >
        <div className="p-4">
          <div className="pb-4">{schedule.title}</div>
          {schedule.tasks.map((item,index) => 
            <div key={`schedule-task-item-${index}`} className="task-item">
                <div>{item.title}</div>
                <div>{item.detail}</div>
                <div>{item.starttime}</div>
                <div>{item.endtime}</div>
              </div>
            )}
        </div>
      </CoreDialog>
    </div>
  );
}