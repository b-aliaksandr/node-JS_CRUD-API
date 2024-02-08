import dotenv from 'dotenv';
import { stdout } from 'node:process';
import http from 'node:http';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    data: 'Init CRUD API task',
  }));
});

server.listen({ port: PORT, host: HOST });
stdout.write(`Running server on port ${PORT}`);