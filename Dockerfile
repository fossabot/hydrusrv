FROM mhart/alpine-node:latest

RUN apk --update add build-base python

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .
RUN chmod +x ./docker-bootstrap.sh

EXPOSE 8000

ENTRYPOINT ["/usr/src/app/docker-bootstrap.sh"]
