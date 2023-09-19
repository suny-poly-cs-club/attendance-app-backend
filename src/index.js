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

// for some reason, sending SIGINT through Docker
// doesn't kill it without this
process.on('SIGINT', () => {
  process.exit();
});
