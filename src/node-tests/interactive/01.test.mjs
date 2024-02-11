import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { v4 as uuidv4, validate as validateUUID4 } from 'uuid';
import { build } from '../../app.mjs';

test('Users CRUD API', async () => {
  const port = 5000;
  const host = '127.0.0.1';
  const BASE_URL = `http://${host}:${port}`;

  const app = await build();

  app.listen({ port, host }, () => {
    console.log(`Running server on ${BASE_URL}\r\n`);
  });

  const usersEndpoint = '/api/users';

  await test('it should return empty array of users', async () => {
    const response = await fetch(BASE_URL.concat(usersEndpoint));
    assert.strictEqual(response.status, 200, 'it should be a 200');

    const users = await response.json();
    assert.strictEqual(Array.isArray(users), true, 'it should be an Array');
    assert.strictEqual(users.length, 0, 'an empty array is expected');
  });

  await test('create new user', async () => {
    const newUserData = {
      username: "John 1",
      age: 34,
      hobbies: ["programming"]
    };
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUserData),
    };

    const response = await fetch(BASE_URL.concat(usersEndpoint), options);
    assert.strictEqual(response.status, 201, 'it should be a 201');

    const newUser = await response.json();
    assert.strictEqual(validateUUID4(newUser.id), true, 'it should be valid uuid');
    assert.deepStrictEqual({ id: newUser.id, ...newUserData }, newUser, 'newUserData contains in newUser as expected');
  });

  await describe('get user by id', async () => {
    await it('userId is invalid (not uuid)', async () => {
      const notValidUUID = '123';
      const notValidUUIDResponse = await fetch(BASE_URL.concat(usersEndpoint, `/${notValidUUID}`));
      assert.strictEqual(notValidUUIDResponse.status, 400, 'it should be 400');
    });

    await it(`user doesn't exist`, async () => {
      const notExistUserId = uuidv4();
      const notExistUserResponse = await fetch(BASE_URL.concat(usersEndpoint, `/${notExistUserId}`));
      assert.strictEqual(notExistUserResponse.status, 404, 'it should be 404');
    });

    await it('existing user by id', async () => {
      const newUserData = {
        username: "John 2",
        age: 30,
        hobbies: ["programming", "running"]
      };
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData),
      };

      const newUserResponse = await fetch(BASE_URL.concat(usersEndpoint), options);
      const createdUser = await newUserResponse.json();

      const existedUserId = createdUser.id;
      const existedUserResponse = await fetch(BASE_URL.concat(usersEndpoint, `/${existedUserId}`));
      assert.strictEqual(existedUserResponse.status, 200, 'it should be a 200');

      const user = await existedUserResponse.json();
      assert.strictEqual(existedUserId, user.id, 'user exist as expected');
    });
  });

  app.close();
});