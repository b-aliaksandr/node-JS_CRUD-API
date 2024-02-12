import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import { receiveBody, httpError } from '../utils';
import { CONSTRAINTS, WHERE_CONDITIONS } from '../db/db';
import { ServerResponse, IncomingMessage } from 'http';
import { User, UserData } from 'src/types/user.interface';

export default async function (app) {
  app.router.route({
    method: 'GET',
    url: '/api/users',
    handler: async (req: any, res: ServerResponse<IncomingMessage> & { req: IncomingMessage; }) => {
      try {
        const users: User[] = await app.memoryDB.select('users', '*');
        res.statusCode = 200;
        res.end(JSON.stringify(users));
      } catch (err) {
        if (err instanceof Error) {
          httpError(res, 500, err.message);
        }
      }
    }
  });

  app.router.route({
    method: 'GET',
    url: '/api/users/:id',
    handler: async (client: { res: ServerResponse<IncomingMessage> & { req: IncomingMessage; }; }, parameter: { value: string; }) => {
      try {
        const isValidId = validateUUID(parameter.value);
        if (!isValidId) {
          httpError(client.res, 400, `User ID:${parameter.value} is invalid.`);
        }

        const users: User[] = await app.memoryDB.select(
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

        const user = users.at(0);
        if (!user) {
          httpError(client.res, 404, `User with ID:${parameter.value} doesn't exist.`);
        }

        client.res.statusCode = 200;
        client.res.end(JSON.stringify(user));
      } catch (err) {
        if (err instanceof Error) {
          httpError(client.res, 500, err.message);
        }
      }
    }
  });

  app.router.route({
    method: 'POST',
    url: '/api/users',
    handler: async (req: any, res: ServerResponse<IncomingMessage> & { req: IncomingMessage; }) => {
      try {
        const body = await receiveBody(req);
        const userData: UserData = JSON.parse(body.toString());

        const newUser: User = await app.memoryDB.insert('users', {
          id: uuidv4(),
          ...userData,
        });
        if (newUser) {
          res.statusCode = 201;
          res.end(JSON.stringify(newUser));
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes(CONSTRAINTS.REQUIRED)) {
            httpError(res, 404, err.message);
          }
          httpError(res, 500, err.message);
        }
      }
    }
  });

  app.router.route({
    method: 'PUT',
    url: '/api/users/:id',
    handler: async (client: { res: ServerResponse<IncomingMessage> & { req: IncomingMessage; }; req: any; }, parameter: { value: string; }) => {
      try {
        const isValidId = validateUUID(parameter.value);
        if (!isValidId) {
          httpError(client.res, 400, `User ID:${parameter.value} is invalid.`);
        }

        const users: User[] = await app.memoryDB.select(
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
        const user = users.at(0);
        if (!user) {
          httpError(client.res, 404, `User with ID:${parameter.value} doesn't exist.`);
        }

        const body = await receiveBody(client.req);
        const userData: UserData = JSON.parse(body.toString());

        const updatedUser = await app.memoryDB.update('users', {
          ...userData,
        }, [
          {
            name: 'id',
            value: parameter.value,
            condition: WHERE_CONDITIONS.EQUAL,
          }
        ]);

        if (updatedUser) {
          client.res.statusCode = 200;
          client.res.end(JSON.stringify(updatedUser));
        }
      } catch (err) {
        if (err instanceof Error) {
          httpError(client.res, 500, err.message);
        }
      }
    }
  });

  app.router.route({
    method: 'DELETE',
    url: '/api/users/:id',
    handler: async (client: { res: ServerResponse<IncomingMessage> & { req: IncomingMessage; }; }, parameter: { value: string; }) => {
      try {
        const isValidId = validateUUID(parameter.value);
        if (!isValidId) {
          httpError(client.res, 400, `User ID:${parameter.value} is invalid.`);
        }

        const users: User[] | [] = await app.memoryDB.select(
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
        if (err instanceof Error) {
          httpError(client.res, 500, err.message);
        }
      }
    }
  });
}
