FROM node:12.13.0-stretch-slim
LABEL maintainer="Senomas <agus@senomas.com>"
RUN apt-get update && \
  apt-get install -y iputils-ping curl build-essential git python && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /home/node

ADD package.json .
ADD yarn.lock .
RUN yarn --frozen-lockfile

ADD src src
ADD tsconfig.build.json tsconfig.json
ADD tslint.json tslint.json

RUN npx tsc
RUN mkdir dist/data

ADD config.docker.yaml config.yaml

CMD [ "node", "dist/server.js" ]
