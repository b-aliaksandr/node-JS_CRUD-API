export default async function (app) {
  app.router.route({
    method: 'GET', 
    url: '/api/users', 
    handler: async (req, res) => {
      res.statusCode = 200;
      res.end('All users');
    }
  });

  app.router.route({
    method: 'GET',
    url: '/api/users/:id',
    handler: async (client, parameter) => {
      client.res.statusCode = 200;
      client.res.end(`User with ID:${parameter.value}`);
    }
  });

  app.router.route({
    method: 'POST', 
    url: '/api/users', 
    handler: async (req, res) => {
      res.statusCode = 201;
      res.end('New user');
    }
  });

  app.router.route({
    method: 'PUT',
    url: '/api/users/:id',
    handler: async (client, parameter) => {
      client.res.statusCode = 200;
      client.res.end(`User updated`);
    }
  });

  app.router.route({
    method: 'DELETE',
    url: '/api/users/:id',
    handler: async (client, parameter) => {
      client.res.statusCode = 204;
    }
  });
}
