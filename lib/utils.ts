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

export function formatSignedAmount(
  amount: number,
  direction: "INCOME" | "EXPENSE" | "CREDIT" | "DEBIT"
): string {
  const sign = direction === "INCOME" || direction === "CREDIT" ? "+" : "-";
  return `${sign}Rs ${Math.abs(Number(amount || 0)).toLocaleString()}`;
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
  let cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3)}`;
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned}`;
  }
  return phone;
}
