# beacon

A TypeScript CLI client for [beacon-responder](../beacon-responder). Executes a fixed request workflow against the service and logs every interaction to a file in [NDJSON](https://ndjson.org/) format.

## Prerequisites

- Node.js 20+
- npm
- A running instance of **beacon-responder** (default: `http://localhost:3199`)

## Install

```bash
npm install
```

## Usage

### Development (no build step)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Configuration

Each endpoint has its own URL variable, so you can mix HTTP and HTTPS independently:

| Environment variable | Default | Description |
|----------------------|---------|-------------|
| `HEALTH_URL` | `http://localhost:3199/api/v1/health` | Full URL for the health check endpoint |
| `COMMANDS_URL` | `http://localhost:3199/api/v1/commands` | Full URL for the commands endpoint |
| `LOOPBACK_URL` | `http://localhost:3199/api/v1/loopback` | Full URL for the loopback endpoint |

```bash
# All endpoints on the same host
HEALTH_URL=https://my-host/api/v1/health \
COMMANDS_URL=https://my-host/api/v1/commands \
LOOPBACK_URL=https://my-host/api/v1/loopback \
npm start

# Mixed http/https — useful for comparing protocol behaviour
HEALTH_URL=http://my-host:3199/api/v1/health \
COMMANDS_URL=https://my-host:3200/api/v1/commands \
LOOPBACK_URL=https://my-host:3200/api/v1/loopback \
npm start
```

## Request workflow

The client runs the following steps in sequence:

1. **Health check** — `GET /api/v1/health`
   - Retries up to **3 times** with a **2 s** delay between attempts
   - Aborts with exit code `1` if all attempts fail

2. **Fetch commands** — `GET /api/v1/commands`
   - Logs the full command array received from the server

3. **Loopback per command** — iterates every command returned in step 2:
   - Even index (0, 2, 4, …) → `PUT /api/v1/loopback`
   - Odd index (1, 3, 5, …) → `POST /api/v1/loopback`
   - Request body:
     ```json
     {
       "command": "<command name>",
       "command-execution-result": "<uuid>"
     }
     ```

## Logging

All requests and responses are appended to `requests.log` in the project root (created automatically on first run).

Each line is a self-contained JSON object:

```jsonl
{"timestamp":"2026-02-27T12:00:00.000Z","step":"health-check (attempt 1)","request":{"method":"GET","url":"/api/v1/health"},"response":{"status":200,"data":"Up and running"}}
{"timestamp":"2026-02-27T12:00:00.050Z","step":"fetch-commands","request":{"method":"GET","url":"/api/v1/commands"},"response":{"status":200,"data":[...]}}
{"timestamp":"2026-02-27T12:00:00.100Z","step":"loopback-put-command-0","request":{"method":"PUT","url":"/api/v1/loopback","body":{"command":"start","command-execution-result":"550e8400-e29b-..."}},"response":{"status":200,"data":{...}}}
```

### Log entry schema

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 string | When the request was made |
| `step` | string | Descriptive label for the workflow step |
| `request.method` | string | HTTP method |
| `request.url` | string | Path relative to base URL |
| `request.body` | object? | Request payload (loopback steps only) |
| `response.status` | number | HTTP status code |
| `response.data` | any | Parsed response body |
| `error` | string? | Error message if the request failed |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled app from `dist/` |
| `npm run dev` | Run directly with `ts-node` |
| `npm run lint` | Lint `src/` with ESLint |

## Project structure

```
beacon/
├── src/
│   ├── client.ts    Axios instance (reads BASE_URL)
│   ├── logger.ts    NDJSON file logger
│   └── index.ts     Main workflow
├── dist/            Compiled output (after build)
├── requests.log     Appended on each run
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```
