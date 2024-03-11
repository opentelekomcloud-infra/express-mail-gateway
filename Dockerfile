# syntax=docker/dockerfile:1

FROM node:20

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

USER 1001

COPY . .

EXPOSE 6000
