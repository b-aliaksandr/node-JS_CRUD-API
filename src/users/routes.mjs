import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import { receiveBody, httpError } from '../utils.mjs';
import { CONSTRAINTS, WHERE_CONDITIONS } from '../db/db.mjs';

export default async function (app) {
  app.router.route({
    method: 'GET',
    url: '/api/users',
    handler: async (req, res) => {
      try {
        const users = await app.memoryDB.select('users', '*');
        res.statusCode = 200;
        res.end(JSON.stringify(users));
      } catch (err) {
        httpError(res, 500, err.message);
      }
    }
  });

  app.router.route({
    method: 'GET',
    url: '/api/users/:id',
    handler: async (client, parameter) => {
      try {
        const isValidId = validateUUID(parameter.value);
        if (!isValidId) {
          httpError(client.res, 400, `User ID:${parameter.value} is invalid.`);
        }

        const users = await app.memoryDB.select(
          'users',
          '*',
          [
            {
              name: 'id',
              value: parameter.value,
              condition: WHERE_CONDITIONS.EQUAL,
            }
          ],
        );

        const user = JSON.stringify(users.at(0));
        if (!user) {
          httpError(client.res, 404, `User with ID:${parameter.value} doesn't exist.`);
        }

        client.res.statusCode = 200;
        client.res.end(user);
      } catch (err) {
        httpError(client.res, 500, err.message);
      }
    }
  });

  app.router.route({
    method: 'POST',
    url: '/api/users',
    handler: async (req, res) => {
      try {
        const body = await receiveBody(req);
        const userData = JSON.parse(body.toString());

        const newUserData = await app.memoryDB.insert('users', {
          id: uuidv4(),
          ...userData,
        });
        const newUser = JSON.stringify(newUserData);
        if (newUser) {
          res.statusCode = 201;
          res.end(newUser);
        }
      } catch (err) {
        if (err.message.includes(CONSTRAINTS.REQUIRED)) {
          httpError(res, 404, err.message);
        }
        httpError(res, 500, err.message);
      }
    }
  });

  app.router.route({
    method: 'PUT',
    url: '/api/users/:id',
    handler: async (client, parameter) => {
      try {
        const isValidId = validateUUID(parameter.value);
        if (!isValidId) {
          httpError(client.res, 400, `User ID:${parameter.value} is invalid.`);
        }

        const users = await app.memoryDB.select(
          'users',
          '*',
          [
            {
              name: 'id',
              value: parameter.value,
              condition: WHERE_CONDITIONS.EQUAL,
            }
          ],
        );
        const user = JSON.stringify(users.at(0));
        if (!user) {
          httpError(client.res, 404, `User with ID:${parameter.value} doesn't exist.`);
        }

        const body = await receiveBody(client.req);
        const userData = JSON.parse(body.toString());

        const updatedUserData = await app.memoryDB.update('users', {
          ...userData,
        }, [
          {
            name: 'id',
            value: parameter.value,
            condition: WHERE_CONDITIONS.EQUAL,
          }
        ]);

        const updatedUser = JSON.stringify(updatedUserData);
        if (updatedUser) {
          client.res.statusCode = 200;
          client.res.end(updatedUser);
        }
      } catch (err) {
        httpError(client.res, 500, err.message);
      }
    }
  });

  app.router.route({
    method: 'DELETE',
    url: '/api/users/:id',
    handler: async (client, parameter) => {
      try {
        const isValidId = validateUUID(parameter.value);
        if (!isValidId) {
          httpError(client.res, 400, `User ID:${parameter.value} is invalid.`);
        }

        const users = await app.memoryDB.select(
          'users',
          '*',
          [
            {
              name: 'id',
              value: parameter.value,
              condition: WHERE_CONDITIONS.EQUAL,
            }
          ],
        );

        if (!users.at(0)) {
          httpError(client.res, 404, `User with ID:${parameter.value} doesn't exist.`);
        }

        await app.memoryDB.remove(
          'users',
          [
            {
              name: 'id',
              value: parameter.value,
              condition: WHERE_CONDITIONS.EQUAL,
            }
          ],
        );

        client.res.statusCode = 204;
        client.res.end();
      } catch (err) {
        httpError(res, 500, err.message);
      }
    }
  });
}
