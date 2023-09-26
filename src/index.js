import fastify from "fastify";

import {userRoutes} from './routes/user.js';

const PORT = Number(process.env.PORT || 3000);

const app = fastify();

app.register(userRoutes, {prefix: '/user'});

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
  
	

app.post("/sign-up",(request,reply) =>{
	reply.code(500);
	return '{"status":"ERROR"}';
});

app.post("/login",(request,reply) =>{
	replay.code(403);
	return '{"status":"ERROR")';
});

app.post("/check-in", (request,reply) =>{
	var token = request.body.token;
	var success  = checkIn(token);
	return '{"success": '+success+'}';
});

function checkIn(token){
	return false;
}

// for some reason, sending SIGINT through Docker
// doesn't kill it without this
process.on('SIGINT', () => {
  process.exit();
});
