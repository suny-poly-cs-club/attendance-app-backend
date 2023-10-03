import fastify from "fastify";

import {userRoutes} from './routes/user.js';
import {postEndpoints} from './posted.js';
import {Database} from './database.js';

const PORT = Number(process.env.PORT || 3000);

const app = fastify();

const database = new Database();

app.register(userRoutes, {prefix: '/user'});
app.register(postEndpoints, {prefix: '/'});

app.get('/', (request, reply) => {
  return {hi: 'hello'};
});

app.post('/', (request, reply) => {
  console.log(request.body);
  return {};
});

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
