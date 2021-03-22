FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY . .

RUN rm -rf node_modules/ && npm install
# If you are building your code for production
# RUN npm ci --only=production

EXPOSE 8080
CMD [ "node", "app.js" ]
