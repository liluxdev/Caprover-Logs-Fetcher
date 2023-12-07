
FROM node:19

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "--max-old-space-size=2048","server.js" ]
