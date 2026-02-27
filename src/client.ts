import axios from 'axios';

export const HEALTH_URL =
  process.env.HEALTH_URL ?? 'http://localhost:3199/api/v1/health';

export const COMMANDS_URL =
  process.env.COMMANDS_URL ?? 'http://localhost:3199/api/v1/commands';

export const LOOPBACK_URL =
  process.env.LOOPBACK_URL ?? 'http://localhost:3199/api/v1/loopback';

export const http = axios.create({
  headers: { 'Content-Type': 'application/json' },
});
