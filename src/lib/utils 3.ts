import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Ensina ao tailwind-merge os tokens do tema (globals.css) que fogem da escala do Tailwind. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["9-5", "11", "13", "13-5", "15", "22"],
      leading: ["title", "badge"],
      tracking: ["label", "title"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
