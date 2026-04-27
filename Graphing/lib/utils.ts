import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class tokens; later wins on Tailwind conflicts */
export function cn(...parts: ClassValue[]) {
  return twMerge(clsx(parts));
}
