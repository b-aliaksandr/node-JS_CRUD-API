import { stdout } from 'node:process';

const PARAMETER_MARKER = ':';
const routeKeySeparator = ' ';

const stringifyRouteKey = ({ url, method }) => {
  return [url, method].join(routeKeySeparator);
};

const parseRouteKey = (key) => {
  return key.split(routeKeySeparator);
};

export async function createRouter() {
  const routesEntities = new Set();
  const staticRoutes = new Map();
  const dynamicRoutes = new Map();

  const initializeRoute = (options) => {
    const { method, url, handler } = options;
    let parameter = null;

    const entities = url.split('/');
    // matching entities
    for (const entity of entities) {
      if (entity.includes(PARAMETER_MARKER) || !Boolean(entity)) continue;
      routesEntities.add(entity);
    }

    // parse last entity's parameter
    if (url.includes(PARAMETER_MARKER)) {
      const entitiesParameters = entities.filter((entity) => entity.includes(PARAMETER_MARKER));
      const lastParameter = entitiesParameters.at(-1);
      parameter = lastParameter;
    }

    if (parameter) {
      const parameterIndex = entities.findIndex((item) => item === parameter);
      const entityPath = entities.slice(0, parameterIndex).join('/').concat('/');
      dynamicRoutes.set(stringifyRouteKey({ url: entityPath, method }), { method, parameter: { name: parameter }, handler });
    } else {
      staticRoutes.set(stringifyRouteKey({ url, method }), { method, handler });
    }
  };

  const findDynamicRoute = ({ url, method }) => {
    const entities = url.split('/');

    let findedEntityPath = null;
  
    let isFindedParameter = false;
    let parameterValue = null;
    for (const entity of entities.toReversed()) {
      if (isFindedParameter) {
        const entityIndex = entities.findIndex((item) => item === entity);
        parameterValue = entities.at(entityIndex + 1);
        findedEntityPath = entities.slice(0, entityIndex + 1).join('/').concat('/');
        break;
      }
      if (!routesEntities.has(entity)) {
        isFindedParameter = true;
      }
    }

    const route = dynamicRoutes.get(stringifyRouteKey({ url: findedEntityPath, method }));

    return {...route, parameter: { ...route.parameter, value: parameterValue }};
  };

  const printRoutes = () => {
    if (staticRoutes.size === 0 && dynamicRoutes.size === 0) {
      return stdout.write('No routes');
    }
    const dynamicRoutesKeys = [];
    for (const [key, value] of dynamicRoutes.entries()) {
      const [url, method] = parseRouteKey(key);
      dynamicRoutesKeys.push(`${url.concat(value.parameter.name)} (${method})`);
    }
    const staticRoutesKeys = Array.from(staticRoutes.keys()).map((key) => {
      const [url, method] = parseRouteKey(key);
      return `${url} (${method})`;
    });

    const routes = [...staticRoutesKeys, ...dynamicRoutesKeys]
      .sort((keyA, keyB) => keyA > keyB ? 1 : -1);

    for (const route of routes) {
      stdout.write(`${route} \r\n`);
    }
  };

  const routing = ({ url, method }) => {
    const staticRoute = staticRoutes.get(stringifyRouteKey({ url, method }));
    if (staticRoute) {
      return staticRoute;
    }

    const dynamicRoute = findDynamicRoute({ url, method });
    return dynamicRoute;
  };

  return {
    route: initializeRoute,
    printRoutes,
    routing,
  }
};