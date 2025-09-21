import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isCellnumber(cellNumber: string) {
  const phRegex = /^(?:\+639|09)\d{9}$/;
  return phRegex.test(cellNumber);
}
