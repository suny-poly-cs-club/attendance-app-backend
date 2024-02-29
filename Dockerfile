FROM node:lts-alpine
WORKDIR /usr/src/app
RUN corepack enable
COPY ./package.json ./pnpm-lock.yaml ./
RUN pnpm install
COPY . .
EXPOSE 3000
EXPOSE 5432
CMD node src/index.js
