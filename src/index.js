import 'dotenv/config';
import fastify from 'fastify';

import {userRoutes} from './routes/user.js';
import {postEndpoints} from './posted.js';
import {Context} from "./context.js";
import {Database} from './database.js';
import {AuthManager} from './auth.js';

const main = async () => {
  const PORT = Number(process.env.PORT || 3000);

  const app = fastify({
    logger: true,
  });

  const db = new Database();
  await db.connect();

  const authManager = new AuthManager(db);

  app.decorateRequest('ctx', null);
  app.decorateRequest('user', null);

  app.addHook('onRequest', (req, reply, done) => {
    const ctx = new Context({req, reply, db, authManager});
    req.ctx = ctx;

    done();
  });

  app.register(userRoutes, {prefix: '/user', onRequest: {}});
  app.register(postEndpoints, {prefix: '/'});

  try {
    await app.listen({
      port: PORT,
      host: '0.0.0.0',
    })
      .then(addr => {
        console.log("Listening on", addr);
      });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

main().catch(console.error);

// for some reason, sending SIGINT through Docker
// doesn't kill it without this
process.on('SIGTERM', () => {
  process.exit();
});
