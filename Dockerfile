# syntax=docker/dockerfile:1

FROM registry.access.redhat.com/ubi8/nodejs-20:1-22 as build

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

USER 1001

COPY . .

EXPOSE 6000
