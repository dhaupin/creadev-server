# @creadev.org/server

> Server - HTTP server

[![npm](https://img.shields.io/npm/v/@creadev.org/server)](https://www.npmjs.com/package/@creadev.org/server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @creadev.org/server
```

## Usage

```typescript
import { Server, createServer, Request, Response } from '@creadev.org/server';

const server = createServer({ port: 3000 });
server.use(async (req) => {
  return { status: 200, body: 'Hello' };
});
await server.start();
```

## API

| Function | Description |
|----------|-------------|
| `createServer(options?)` | Create server |
| `server.use(middleware)` | Add middleware |
| `server.start()` | Start server |
| `server.stop()` | Stop server |

## License

MIT
trigger
