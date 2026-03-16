type DayApiFormat =
  | "YYYY/MM/DD HH:mm:ss"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY HH:mm:ss";

export const formatDateTime = (
  dateString: string,
  type: DayApiFormat,
): string => {
  const date = new Date(dateString);
  if(!(date instanceof Date)) return "not day date"
  if (isNaN(date.getTime())) return "Invalid Date"
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  if (type === "MM/DD/YYYY") {
    return `${mm}/${dd}/${yyyy}`;
  }
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
};
