import { ChangeEventHandler, useState } from "react"
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  value?: Date
  onChange: (date?: Date) => void
}

function DateTimePicker({
  value,
  onChange,
}: Props) {
  const [selectDate, setSelectDate] = useState("00:00")
  const [timeValue, setTimeValue] = useState("00:00")
  const [open, setOpen] = useState(false)

  // 更新内容は後日使う。
  // useEffect(() => {
  //   if (value) {
  //     setTimeValue(formatDateTime(String(value), "HH:mm"))
  //   }
  // }, [value])

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const time = e.target.value

    const [hours, minutes] = time
      .split(":")
      .map(Number)
    
      console.log("time", time, hours, minutes)

    setTimeValue(time)
  }

  const handleDaySelect = (
    date: Date | undefined
  ) => {
    if (!date) {
      onChange(undefined)
      return
    }

    const [hours, minutes] = timeValue
      .split(":")
      .map(Number);

    const seelectedDate = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()} ${hours}:${minutes}`
    setSelectDate(seelectedDate);

    onChange(new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes
      ));
  }

  return (
    <>
      <div className="relative inline-block">
          <input
            type="text"
            value={selectDate}
            readOnly
            onFocus={() => setOpen(true)}
          />

          {open && (
            <div
              className="
                absolute
                top-full
                left-0
                mt-1
                bg-white
                border
                shadow-lg
                rounded
                p-2
                z-50
              "
            >
              <input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
              />

              <DayPicker
                classNames={{
                  day_button: "w-6 h-6 text-xs flex items-center justify-center rounded",
                  chevron: "w-3 h-3",
                }}
                mode="single"
                selected={value}
                onSelect={(date) => {
                  handleDaySelect(date)
                  setOpen(false)
                }}
              />
            </div>
          )}

        </div>
    </>
  )
}

export default DateTimePicker;