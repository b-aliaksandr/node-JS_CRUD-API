import { stdout } from 'node:process';

const routeKeySeparator = ' ';
const stringifyRouteKey = ({ url, method }) => {
  return [url, method].join(routeKeySeparator);
};

const parseRouteKey = (key) => {
  return key.split(routeKeySeparator);
};

export async function createRouter() {
  const routes = new Map();

  const initializeRoute = (options) => {
    const { method, url, handler } = options;
    routes.set(stringifyRouteKey({ url, method }), { method, handler });
  };

  const printRoutes = () => {
    if (routes.size === 0) {
      return stdout.write('No routes');
    }
    const keys = routes.keys();
    for (const key of keys) {
      const [url, method] = parseRouteKey(key);
      stdout.write(`${url} (${method})`);
    }
  };

  const routing = ({ url, method }) => {
    return routes.get(stringifyRouteKey({ url, method }));
  };

  return {
    route: initializeRoute,
    printRoutes,
    routing,
  }
};