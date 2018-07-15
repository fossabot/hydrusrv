FROM mhart/alpine-node:latest

RUN apk --update add build-base python

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

EXPOSE 8000

CMD yarn start
