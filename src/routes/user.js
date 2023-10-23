import {authenticated} from '../auth.js';

export const userRoutes = (app, _options, done) => {
  app.addHook('onRequest', authenticated);

  // returns data about the current user
  app.get('/', async req => {
    return req.user;
  });

  done();
};
