import {authenticated} from '../auth.js';
import { PostgresErrorCode } from '../database.js';

export const checkInRoutes = (app, options, done) => {
  // middleware that blocks unauthenticated access
  app.addHook('onRequest', authenticated());

  app.post('/', async (req, reply) => {
    const code = req.body.code;
    const user = req.user;

    const v = req.ctx.qrManager.verifyQRToken(code);

    if (!v) {
      reply.status(400);
      return {message: 'invalid QR token'};
    }

    try {
      await req.ctx.db.checkIn(user.id, v.cdID);
    } catch (err) {
      if (err.code === PostgresErrorCode.UniqueViolation) {
        reply.status(409);
        return {message: 'already checked in'};
      }

      console.error(err);

      return reply.status(500).send();
    }

    return reply.status(204).send();
  });

  done();
};
