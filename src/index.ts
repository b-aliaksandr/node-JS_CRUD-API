import dotenv from 'dotenv';
import { build } from './app';
import { stdout } from 'node:process';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const main = async () => {
  const app = await build();

  app.listen({ port: PORT, host: HOST }, () => {
    stdout.write(`Running server on ${HOST}:${PORT}\r\n`);
    stdout.write('Available routes: \r\n');
    app.router.printRoutes();
    stdout.write('\r\n');
  });
};

main().catch((err) => {
  stdout.write(err.message);
});