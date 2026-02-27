import { http, HEALTH_URL, COMMANDS_URL, LOOPBACK_URL } from './client';
import { log } from './logger';
import { AxiosError } from 'axios';

const HEALTH_RETRIES = 3;
const HEALTH_RETRY_DELAY_MS = 2000;

interface Command {
  id: number;
  name: string;
  description: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp(): string {
  return new Date().toISOString();
}

function errorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    return err.message;
  }
  return String(err);
}

async function checkHealth(): Promise<void> {
  for (let attempt = 1; attempt <= HEALTH_RETRIES; attempt++) {
    try {
      const res = await http.get<string>(HEALTH_URL);
      log({
        timestamp: timestamp(),
        step: `health-check (attempt ${attempt})`,
        request: { method: 'GET', url: HEALTH_URL },
        response: { status: res.status, data: res.data },
      });
      return;
    } catch (err) {
      const msg = errorMessage(err);
      log({
        timestamp: timestamp(),
        step: `health-check (attempt ${attempt})`,
        request: { method: 'GET', url: HEALTH_URL },
        error: msg,
      });

      if (attempt < HEALTH_RETRIES) {
        console.log(`Health check failed. Retrying in ${HEALTH_RETRY_DELAY_MS / 1000}s...`);
        await sleep(HEALTH_RETRY_DELAY_MS);
      } else {
        console.error('Health check failed after all retries. Aborting.');
        process.exit(1);
      }
    }
  }
}

interface CommandsResponse {
  commands: Command[];
}

async function fetchCommands(): Promise<Command[]> {
  const res = await http.get<CommandsResponse>(COMMANDS_URL);
  log({
    timestamp: timestamp(),
    step: 'fetch-commands',
    request: { method: 'GET', url: COMMANDS_URL },
    response: { status: res.status, data: res.data },
  });
  return res.data.commands;
}

async function sendLoopback(command: Command, index: number): Promise<void> {
  const method = index % 2 !== 0 ? 'POST' : 'PUT';
  const body = {
    command: command.name,
    'command-execution-result': crypto.randomUUID(),
  };

  const res =
    method === 'POST'
      ? await http.post(LOOPBACK_URL, body)
      : await http.put(LOOPBACK_URL, body);

  log({
    timestamp: timestamp(),
    step: `loopback-${method.toLowerCase()}-command-${index}`,
    request: { method, url: LOOPBACK_URL, body },
    response: { status: res.status, data: res.data },
  });
}

async function main(): Promise<void> {
  console.log('=== beacon client starting ===');

  // 1. Health check (with retries)
  await checkHealth();

  // 2. Fetch commands
  const commands = await fetchCommands();
  console.log(`Received ${commands.length} command(s).`);

  // 3. Loopback for each command
  for (let i = 0; i < commands.length; i++) {
    await sendLoopback(commands[i], i);
  }

  console.log('=== beacon client done ===');
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
