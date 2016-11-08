FROM node:onbuild

RUN npm install -g http-server

EXPOSE 8080

CMD ['http-server']
