# Running

```sh
# copy `.env.example` to `.env` and change values accordingly
$ cp .env.example .env
# install external dependencies
$ pnpm install
# run database migrations
$ dbmate up
# run app
$ node src/index.js # runs the app on default port (3000)
$ PORT=8000 node src/index.js # runs the app on port 8000
```

#### Docker Compose Instructions
```sh
# copy `.env.example` to `.env` and change values accordingly
$ cp .env.example .env
# start the database
$ docker compose up -d postgres
# start the app
$ docker compose up backend
```

# Documentation
### Endpoints

`GET /user`
`GET /user/:id`
`GET /qr`

`POST /sign-up`
`POST /login`
`POST /check-in`
