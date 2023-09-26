export const userRoutes = (app, options, done) => {
  // returns data about the current user
  app.get('/', (req, reply) => {
    return 'hi';
  });

  done();
};
