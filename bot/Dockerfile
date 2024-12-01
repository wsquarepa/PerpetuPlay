FROM node:23.3.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ARG MUSIC_DIRECTORY
ENV MUSIC_DIRECTORY=$MUSIC_DIRECTORY
COPY $MUSIC_DIRECTORY /usr/src/app/music
CMD ["npm", "start"]