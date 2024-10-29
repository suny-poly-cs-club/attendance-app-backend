import 'dotenv/config';
import fs from 'node:fs';
import _fastifyCors from '@fastify/cors';
import fastify from 'fastify';
import {AuthManager} from './auth.js';
import {Database} from './database.js';
import {authenticated} from './middleware/auth.js';
import {Context} from './middleware/context.js';
import {postEndpoints} from './posted.js';
import {QRManager} from './qr.js';
import {checkCodeRoutes, checkInRoutes} from './routes/checkIn.js';
import {clubEndpointsGE, clubEndpointsSA} from './routes/club.js';
import {clubDayRoutes} from './routes/clubDay.js';
import {userRoutes} from './routes/user.js';

const main = async () => {
  const PORT = Number(process.env.PORT || 3000);

  const USE_HTTPS =
    process.env.USE_HTTP === 'true' || process.env.USE_HTTP === '1';

  if (USE_HTTPS) {
    console.log('Using HTTPS');
  }

  const app = fastify({
    logger: true,
    // genReqId: () => undefined,
    ...(USE_HTTPS
      ? {
          http2: true,
          https: {
            allowHTTP1: true, //fallback support for non https connections
            key: fs.readFileSync(process.env.SSL_KEY),
            cert: fs.readFileSync(process.env.SSL_CERT),
          },
        }
      : {}),
  });

  app.register(_fastifyCors, {
    // TODO: set up cors
    origin: true,
  });

  const db = new Database();
  await db.connect();

  const authManager = new AuthManager(db);
  const qrManager = new QRManager(db);

  app.decorateRequest('ctx', null);
  app.decorateRequest('user', null);

  // TODO: can this use fastify.register instead
  Context.register(app, {db, authManager, qrManager});

  //get info fot the current loged in user
  app.get('/api/user', {onRequest: [authenticated()]}, req => req.user);

  app.register(userRoutes, {prefix: '/api/users'});
  app.register(postEndpoints, {prefix: '/api/'});
  app.register(checkInRoutes, {prefix: '/api/check-in'});
  app.register(checkCodeRoutes, {prefix: '/api/check-code'});
  app.register(clubDayRoutes, {prefix: '/api/clubs/:clubId/club-days'});
  app.register(clubEndpointsGE, {prefix: '/api/clubs'});
  app.register(clubEndpointsSA, {prefix: '/api/clubsa'});

  //used by the app to verify the exsistance of this server
  app.get('/api/ver', (_req, reply) => {
    reply.type('text/plain');
    return 'attendance app cs';
  });

  //message that is displayed before the login/signup screen
  //ex: <ORGANIZATION> attandace login. contact IT if you need help
  app.get('/api/message', (_req, reply) => {
    reply.type('text/plain');
    return 'ENTER ORGANIZATION SPECIFIC MESSAGE HERE';
  });

  try {
    await app
      .listen({
        port: PORT,
        host: '0.0.0.0',
      })
      .then(addr => {
        console.log('Listening on', addr);
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
