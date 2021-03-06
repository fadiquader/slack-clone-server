FROM node:9
WORKDIR /app
COPY package-lock.json .
COPY package.json .
RUN npm install
COPY build .
COPY wait-for-it.sh .
CMD node index.js