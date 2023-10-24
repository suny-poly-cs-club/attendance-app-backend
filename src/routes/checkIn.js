import {authenticated} from '../auth';

export const checkInRoutes = (app, options, done) => {
  // middleware that blocks unauthenticated access
  app.addHook('onRequest', authenticated);

  app.post('/', async (req, reply) => {
    // TODO: somehow we need to get the club_day id from the QR code, how do we do that?
    const code = req.body.code;

    const user = req.user;
    await req.ctx.db.checkIn(user.id, code);

    return reply.status(204).send();
  });
};
