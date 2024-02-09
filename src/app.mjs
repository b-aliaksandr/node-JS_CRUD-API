import http from 'node:http';
import { createRouter } from './router.mjs';

export async function build() {
  const router = await createRouter();

  const server = http.createServer(async (req, res) => {
    const { url, method } = req;
    const route = router.routing({ method, url });

    if (route) {
      route.handler(req, res);
    } else {
      res.statusCode = 404;
      res.end(`"I apologize, I couldn't find what you were looking for."`);
    }
  });

  const serverAPI = {
    listen: server.listen.bind(server),
  };

  return {
    ...serverAPI,
    router,
  };
};
