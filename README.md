# Running

```sh
# install external dependencies
$ pnpm install
# run app
$ node src/index.js # runs the app on default port (3000)
$ PORT=8000 node src/index.js # runs the app on port 8000
```

#### Docker Instructions
```sh
# build the docker image into a tag called `app-backend`
$ docker build . -t app-backend
# run on port 3000
$ docker run --rm -i -p 3000:3000 app-backend
```
