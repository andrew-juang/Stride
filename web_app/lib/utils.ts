import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeExercise(exercise: string): string {
  if (!exercise) return '';
  
  // Handle camelCase exercise names (e.g., "armRaise" -> "Arm Raise")
  const words = exercise.split(/(?=[A-Z])/).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}
