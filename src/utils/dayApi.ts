type DayApiFormat =
  | "YYYY/MM/DD HH:mm"
  | "YYYY/MM/DD HH:mm:ss"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY HH:mm:ss";

export const formatDateTime = (
  timeDate: string | number,
  type: DayApiFormat,
  lineBreak: boolean = false
): string => {
  let date = new Date();
  if(typeof timeDate === "number" && !isNaN(timeDate)) {
    date = new Date(timeDate * 1000);
  }else {
    date = new Date(timeDate);
  }
  let setDayinfo = ""
  if(!(date instanceof Date)) return "not day date"
  if (isNaN(date.getTime())) return "Invalid Date"
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  if (type === "MM/DD/YYYY") {
    setDayinfo = `${mm}/${dd}/${yyyy}`;
  } else if (type === "DD/MM/YYYY HH:mm:ss") {
    setDayinfo = `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  } else if (type === "YYYY/MM/DD HH:mm") {
    setDayinfo = `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
  } else if (type === "YYYY/MM/DD HH:mm:ss") {
    setDayinfo = `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
  } else {
    setDayinfo = `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
  }
  if(lineBreak) {
    return setDayinfo.replace(" ", "\n");
  }
  return setDayinfo;
};

export const formatUnixDateTime = (
  unixTime: number,
  type: DayApiFormat,
  lineBreak: boolean = false
): string => {
  let setDayinfo = ""
  const date = new Date(unixTime*1000);
  if(!(date instanceof Date)) return "not day date"
  if (isNaN(date.getTime())) return "Invalid Date"
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  if (type === "MM/DD/YYYY") {
    setDayinfo = `${mm}/${dd}/${yyyy}`;
  } else {
    setDayinfo = `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
  }

  return setDayinfo;
};

