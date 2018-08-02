#!/bin/sh

yarn migrate

stop_server() {
  pkill node
  sleep 1
}

trap 'stop_server' SIGTERM

node ./bin/www &

wait $!
