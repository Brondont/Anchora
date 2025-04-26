import { Dayjs } from "dayjs";

export default function isAfterDate(
  date: Dayjs | null,
  compareDate: Dayjs | null
): boolean {
  if (!date || !compareDate) return false;
  return date.isAfter(compareDate);
}
