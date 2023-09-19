import fastify from "fastify";

const PORT = Number(process.env.PORT || 3000);

const app = fastify();

app
  .listen({port: PORT})
  .catch(err => {
    console.error(`Failed to listen on port ${PORT}:`, err);
  })
  .then(addr => {
    console.log("Listening on", addr);
  });
  
	

app.post("/sign-up",(request,reply) =>{
	
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
