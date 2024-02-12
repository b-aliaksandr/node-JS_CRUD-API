import { stdout, pid } from 'node:process';
import http from 'node:http';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import dotenv from 'dotenv';
import { build } from './app.mjs';

dotenv.config();

const HOST = process.env.HOST || '127.0.0.1';

const multi = async () => {
  const port = Number(String(availableParallelism()).padEnd(4, 0));
  const app = await build();

  if (cluster.isPrimary) {
    const count = availableParallelism() - 1;
    console.log(`Master pid: ${pid}`);
    console.log(`Starting ${count} forks`);
    for (let i = 0; i < count; i++) {
      cluster.fork();
    }

    // const workers = Object.values(cluster.workers);
    // let workerOrderIndex = 0;

    // const server = http.createServer((async (req, res) => {
    //   const { headers, url, method } = req;
    //   console.log({ url }, pid);
    //   const worker = workers.at(workerOrderIndex);
    //   // const workerPort = parseInt(worker.id, 10) + port;
    //   // const newURL = new URL(url, `http://${HOST}/${workerPort}`);
    //   worker.send(JSON.stringify(req, res));
    // }));
    // server.listen({ port, host: HOST }, () => {
    //   stdout.write(`Running master server on ${HOST}:${port}\r\n`);
    // });
  } else if (cluster.isWorker) {
    const id = cluster.worker.id;
    const workerPort = parseInt(id, 10) + port;
    console.log(`Worker: ${id}, pid: ${pid}, port: ${port}`);

    // process.on('message', (msg) => {
    //   const { req, res } = JSON.parse(msg);
    //   app.serve(route, req, res);
    // });
    const server = http.createServer(((req, res) => {
      const { url, method } = req;
      const route = app.router.routing({ method, url });

      res.setHeader('Process-Id', pid);
      console.log({ pid });
      app.serve(route, req, res, pid);
    }));
    server.listen({ port: port, host: HOST }, () => {
      stdout.write(`Running server on ${HOST}:${port}\r\n`);
    });
  };
}

multi();