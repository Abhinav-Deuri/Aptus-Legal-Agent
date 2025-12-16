export interface RuleLensItem {
  term: string;
  definition: string;
}

export interface AptusResponse {
  tldr: string;
  ruleLens: RuleLensItem[];
  actionableSteps: string[];
  sourceCitation: string;
}

export interface InputState {
  text: string;
  files: File[];
  language: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];