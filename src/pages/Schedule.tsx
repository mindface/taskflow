import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Scheduler from "../components/Scheduler";

function Schedule() {
  return (
    <div className="schedule">
      <Scheduler />
    </div>
  );
}

export default Schedule;
