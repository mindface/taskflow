import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ScheduleDetail from "../components/ScheduleDetail";

function Schedule() {
  useEffect(() => {
    (async () => {
      try {
        await invoke("init_schedule_db");
      } catch (e) {
        console.error("init_schedule_db error", e);
      }
    })();
  }, []);
  return (
    <div className="schedule">
      <ScheduleDetail />
    </div>
  );
}

export default Schedule;
