import http from 'node:http';
import { createRouter } from './router.mjs';
import createMemoryDB, { DATA_TYPES, CONSTRAINTS } from './db/db.mjs';
import usersRoutes from './users/routes.mjs';
import { httpError } from './utils.mjs';

export async function build() {
  const memoryDB = await createMemoryDB({ logger: process.stdout });
  const router = await createRouter();

  try {
    await memoryDB.createTable('users', [
      {
        name: 'id',
        dataType: DATA_TYPES.STRING,
        constraints: [CONSTRAINTS.REQUIRED, CONSTRAINTS.UNIQUE],
      },
      {
        name: 'username',
        dataType: DATA_TYPES.STRING,
        constraints: [CONSTRAINTS.REQUIRED],
      },
      {
        name: 'age',
        dataType: DATA_TYPES.NUMBER,
        constraints: [CONSTRAINTS.REQUIRED],
      },
      {
        name: 'hobbies',
        dataType: DATA_TYPES.ARRAY_OF_STRINGS,
        constraints: [CONSTRAINTS.REQUIRED],
      },
    ]);
  } catch (err) {
    throw new Error(`memoryDB: ${err.message}`);
  }

  usersRoutes({ router, memoryDB });

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
    close: server.close.bind(server),
  };

  return {
    ...serverAPI,
    memoryDB,
    router,
  };
};
