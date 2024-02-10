import http from 'node:http';
import { createRouter } from './router.mjs';
import createMemoryDB, { DATA_TYPES, CONSTRAINTS } from './db/db.mjs';
import usersRoutes from './users/routes.mjs';
import { httpError } from './utils.mjs';

export async function build() {
  const memoryDB = await createMemoryDB({ logger: process.stdout });
  const router = await createRouter();
  
  usersRoutes({ router });
  
  const server = http.createServer(async (req, res) => {
    const { url, method } = req;
    const route = router.routing({ method, url });

    if (route) {
      if (route.parameter) {
        route.handler({ req, res }, route.parameter);
      } else {
        route.handler(req, res);
      }
    } else {
      httpError(res, 404, `I apologize, I couldn't find what you were looking for.`);
    }
  });

  const serverAPI = {
    listen: server.listen.bind(server),
  };

  return {
    ...serverAPI,
    memoryDB,
    router,
  };
};
