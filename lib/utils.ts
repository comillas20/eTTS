import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function feeCalculator(amount: number, type: "cash-in" | "cash-out") {
  const rate = 0.02;
  const ladder = 500;

  if (type === "cash-out") {
    const M = Math.floor(amount / ladder) * ladder;
    const initialFee = M * rate;
    const diff = amount - M;
    const belowInitialFee = initialFee >= diff;

    return belowInitialFee ? initialFee : initialFee + ladder * rate;
  } else return Math.ceil(amount / ladder) * ladder * rate;
}

export function isCellnumber(cellNumber: string) {
  const phRegex = /^(?:\+639|09)\d{9}$/;
  return phRegex.test(cellNumber);
}
