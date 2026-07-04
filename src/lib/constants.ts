export type Role = "ADMIN" | "USER";

export const COMMO_TYPES = [
  { value: "NavLet", label: "NavLet" },
  { value: "CivilianLetter", label: "Civilian Letter" },
  { value: "Orders", label: "Orders" },
  { value: "Others", label: "Others" },
] as const;

export const STATUSES = [
  { value: "Completed", label: "Completed", color: "bg-green-700 text-white" },
  { value: "Pending", label: "Pending", color: "bg-amber-500 text-black" },
] as const;

export function formatMonthYear(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatDisplayMonth(monthYear: string): string {
  const [y, m] = monthYear.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatDateDrafted(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export function commoTypeLabel(value: string): string {
  return COMMO_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function statusColor(value: string): string {
  return STATUSES.find((s) => s.value === value)?.color ?? "bg-gray-200";
}
