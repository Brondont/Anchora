export default function getDate(timeStr: string): string {
  const time = new Date(timeStr);
  const now = new Date();

  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);

  const isWithinThisWeek = time >= startOfWeek;

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayName = dayNames[time.getDay()];

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  if (isWithinThisWeek) {
    return `${dayName} ${hours}:${minutes}`;
  } else {
    const month = time.toLocaleString("default", { month: "short" });
    const day = time.getDate();
    const year = time.getFullYear();
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  }
}
