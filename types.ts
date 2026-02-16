
// Fixed: Added missing exported members to satisfy imports in geminiService.ts and TimerCard.tsx

export enum SessionStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

/**
 * Status for generic timers, added to fix import error in TimerCard.tsx.
 * It is compatible with the main SessionStatus.
 */
export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export interface AppSound {
  id: string;
  name: string;
  url: string;
  isCustom: boolean;
}

export interface EatingSession {
  totalMinutes: number;
  remainingSeconds: number;
  currentBiteSeconds: number;
  biteDurationSeconds: number;
  status: SessionStatus;
  completedBites: number;
  soundId: string;
}

export interface SessionHistoryEntry {
  id: string;
  timestamp: number;
  totalMinutes: number;
  completedBites: number;
  biteDuration: number;
}

/**
 * Interface for Timer used in the TimerCard component.
 * Added to fix import error in TimerCard.tsx.
 */
export interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  soundId: string;
}

/**
 * Interface for the structured response from ZenAI.
 * Added to fix import error in services/geminiService.ts.
 */
export interface AICommandResponse {
  action: 'START_SESSION' | 'INFO_ONLY';
  minutes?: number;
  message: string;
}
