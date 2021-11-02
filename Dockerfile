FROM node

WORKDIR /usr/src/app

COPY . .

RUN npm ci --only=production

EXPOSE 3311 3310
CMD [ "npm", "start" ]
