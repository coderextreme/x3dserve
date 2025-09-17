import { io } from 'socket.io-client';
import { globSync } from 'node:fs';
import { glob } from 'node:fs/promises';

// The URL is correct. The options are simplified.
// We have REMOVED the `transports: ["polling"]` option.
const socket = io("http://localhost:3000", {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e9,
    pingTimeout: 60000,
    transports: [ "polling", "websocket" ]
});
