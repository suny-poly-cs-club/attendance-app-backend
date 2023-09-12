import fastify from 'fastify';

const PORT = Number(process.env.PORT || 3000);

const app = fastify();

app.listen(process.env.PORT || 3000, (err, addr) => {
  if (err) {
    console.error('Failed to listen on port', PORT);
    throw err;
  }

  console.log('Listening on', addr);
});
