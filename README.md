# Running

#### Docker Compose Instructions (recommended)

**Development** -- uses nodemon to automatically restart the server when changes are made
```sh
# copy `.env.example` to `.env` and change values accordingly
$ cp .env.example .env
# start the app
$ pnpm dev
# to stop everything, ctrl+c then run:
$ docker compose down
```

**Production**
```sh
# copy `.env.example` to `.env` and change values accordingly
$ cp .env.example .env
# start everything
$ docker compose up -d
# stop everything
$ docker compose down
```

#### Without Docker Compose
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
