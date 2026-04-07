# syntax=docker/dockerfile:1

# Use an official Node.js runtime as the base image
FROM node:24-slim

# Set the environment to production
ENV NODE_ENV=production

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install production dependencies with yarn
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Create a non-root user and switch to it
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser && \
    chown -R nodeuser:nodejs /usr/src/app
USER nodeuser

# Copy the rest of the application code
COPY --chown=nodeuser:nodejs . .

# Expose the port the app runs on
EXPOSE 6000
