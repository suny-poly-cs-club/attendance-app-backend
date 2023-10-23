import 'dotenv/config';
import fastify from 'fastify';

import {userRoutes} from './routes/user.js';
import {postEndpoints} from './posted.js';
import {Context} from "./context.js";
import {Database} from './database.js';
import {AuthManager} from './auth.js';

const PORT = Number(process.env.PORT || 3000);

const app = fastify();

const db = new Database();
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

app
  .listen({port: PORT})
  .catch(err => {
    console.error(`Failed to listen on port ${PORT}:`, err);
  })
  .then(addr => {
    console.log("Listening on", addr);
  });

// for some reason, sending SIGINT through Docker
// doesn't kill it without this
process.on('SIGINT', () => {
  process.exit();
});
