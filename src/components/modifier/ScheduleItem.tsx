import { Schedule } from "../../models/Schedule"
import ScheduleDialog from "./ScheduleDialog";

type Props = {
  schedule: Schedule;
}

export default function ImageElement({ schedule }: Props) {

  return (
    <div className="p-8 space-y-4 max-w-md">
      <div className="font-bold">{schedule.title}</div>
      <ScheduleDialog schedule={schedule} />
    </div>
  );
}