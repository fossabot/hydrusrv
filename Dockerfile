FROM mhart/alpine-node:latest

RUN apk --update add build-base python

ARG HOST_USER_ID=1000
ARG HOST_GROUP_ID=1000

ENV HOST_USER_ID=$HOST_USER_ID
ENV HOST_GROUP_ID=$HOST_GROUP_ID

RUN if [ $(getent group ${HOST_GROUP_ID}) ]; then \
    adduser -D -u ${HOST_USER_ID} hydrus; \
  else \
    addgroup -g ${HOST_GROUP_ID} hydrus && \
    adduser -D -u ${HOST_USER_ID} -G hydrus hydrus; \
  fi

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .
RUN chmod +x ./docker-bootstrap.sh

RUN chown -R hydrus:hydrus /usr/src/app

EXPOSE 8000

USER hydrus

ENTRYPOINT ["/usr/src/app/docker-bootstrap.sh"]
