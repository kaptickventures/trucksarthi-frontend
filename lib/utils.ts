import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("file:")) {
    return path;
  }
  const baseUrl = process.env.EXPO_PUBLIC_BASE_FILE_URL || "https://trucksarthi.cloud";
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function toLocalYmd(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLocalStartOfDayIso(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return start.toISOString();
}

export function toLocalEndOfDayIso(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return end.toISOString();
}

export function formatSignedAmount(
  amount: number,
  direction: "INCOME" | "EXPENSE" | "CREDIT" | "DEBIT"
): string {
  const sign = direction === "INCOME" || direction === "CREDIT" ? "+" : "-";
  return `${sign}${formatCurrencyINR(Math.abs(Number(amount || 0)))}`;
}

export function formatCurrencyINR(amount: number, options?: { fallbackToRs?: boolean }): string {
  const value = Number(amount || 0).toLocaleString("en-IN");
  const useAsciiPrefix = options?.fallbackToRs !== false;
  if (useAsciiPrefix) return `Rs ${value}`;

  // Use escaped unicode for rupee so source-file encoding never corrupts it.
  const prefix = "\u20B9";
  return `${prefix} ${value}`;
}

export function formatLabel(label: string | null | undefined): string {
  if (!label) return "";
  return label
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "N/A";
  const digits = String(phone).replace(/\D/g, "");
  const mobile = digits.startsWith("91") ? digits.slice(2, 12) : digits.slice(-10);
  if (mobile.length === 10) return `+91-${mobile}`;
  return phone;
}

export function normalizePhoneInput(value: string | null | undefined): string {
  const digits = String(value || "").replace(/\D/g, "");
  const mobile = digits.startsWith("91") ? digits.slice(2, 12) : digits.slice(0, 10);
  return `+91${mobile}`;
}

export function normalizePanNumber(value: string | null | undefined): string {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

export function normalizeGstinNumber(value: string | null | undefined): string {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 15);
}

export function normalizeAddressInput(value: string | null | undefined): string {
  const parts = String(value || "")
    .replace(/\r?\n+/g, ",")
    .split(",")
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter(Boolean);

  if (parts.length >= 4) {
    return [parts[0], parts[1], parts[2], parts.slice(3).join(" ")].filter(Boolean).join(", ");
  }

  return parts.join(", ");
}
