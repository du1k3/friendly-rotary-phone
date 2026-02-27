import fs from 'fs';
import path from 'path';

const LOG_FILE = path.resolve(__dirname, '..', 'requests.log');

export interface LogEntry {
  timestamp: string;
  step: string;
  request: {
    method: string;
    url: string;
    body?: unknown;
  };
  response?: {
    status: number;
    data: unknown;
  };
  error?: string;
}

export function log(entry: LogEntry): void {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LOG_FILE, line, 'utf8');
  console.log(`[${entry.timestamp}] ${entry.step} — ${entry.response?.status ?? 'ERROR'}`);
}
