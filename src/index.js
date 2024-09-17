import 'dotenv/config';
import fastify from 'fastify';
import _fastifyCors from '@fastify/cors';

import {userRoutes} from './routes/user.js';
import {postEndpoints} from './posted.js';
import {Context} from "./context.js";
import {Database} from './database.js';
import {AuthManager, authenticated} from './auth.js';
import {checkInRoutes} from './routes/checkIn.js';
import {QRManager} from './qr.js';
import {clubDayRoutes} from './routes/clubDay.js';
import {clubEndpointsGE,clubEndpointsSA} from './routes/club.js';

const main = async () => {
  const PORT = Number(process.env.PORT || 3000);

  const app = fastify({
    logger: true,
  });

  app.register(_fastifyCors, {
    // TODO: set up cors
    origin: true,
  });

  const db = new Database();
  await db.connect();

  const authManager = new AuthManager(db);
  const qrManager = new QRManager();

  app.decorateRequest('ctx', null);
  app.decorateRequest('user', null);

  app.addHook('onRequest', (req, reply, done) => {
    const ctx = new Context({req, reply, db, authManager, qrManager});
    req.ctx = ctx;

    done();
  });

  app.get(
    '/user',
    {onRequest: [authenticated()]},
    req => req.user
  );

  app.register(userRoutes, {prefix: '/users'});
  app.register(postEndpoints, {prefix: '/'});
  app.register(checkInRoutes, {prefix: '/check-in'});
  app.register(clubDayRoutes, {prefix: '/clubs/:clubId/club-days'});
  app.register(clubEndpointsGE, {prefix: '/clubs'});
  app.register(clubEndpointsSA, {prefix: '/clubsa'});

  //used by the app to verify the exsistance of this server
  app.get('/ver', (req, reply) => {
    reply.setType("plain/text");
    return "attendance app cs";
  });

  //message that is displayed before the login/signup screen
  //ex: <ORGANIZATION> attandace login. contact IT if you need help
  app.get('/message', (req, reply) => {
    reply.setType("plain/text");
    return "ENTER ORGANIZATION SPECIFIC MESSAGE HERE";
  });

  try {
    await app.listen({
      port: PORT,
      host: '0.0.0.0',
    })
    .then(addr => {
      console.log("Listening on", addr);
      console.log(app.printRoutes());
    });
  } catch (err) {
    console.error('Failed to bind to port', err);
    process.exit(1);
  }
};

main().catch(console.error);

// for some reason, sending SIGINT through Docker
// doesn't kill it without this
process.on('SIGTERM', () => {
  process.exit();
});
