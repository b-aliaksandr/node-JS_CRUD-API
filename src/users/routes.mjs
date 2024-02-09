export default async function (app) {
  app.router.route({ method: 'GET', url: '/api/users', handler: async (req, res) => {
    res.statusCode = 200;
    res.end('All users');
  }});
}
