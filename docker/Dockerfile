FROM alpine:3.20.0 As development

RUN apk add --update nodejs="20.15.1-r0" npm="10.8.0-r0"

ARG NODE_ENV

LABEL maintainer="shreyas.19.dev@gmail.com" \
    version="1.0.0" \
    description="Docker image for coupon-service"

WORKDIR /home/dev/coupon-service

COPY *.json ./

RUN npm install

COPY ./src ./src

RUN npm run build

FROM alpine:3.20.0 As production

RUN apk add --update nodejs="20.15.1-r0" npm="10.8.0-r0"

ENV NODE_ENV=production

ARG IMAGE_VERSION

ENV IMAGE_VERSION=$IMAGE_VERSION

WORKDIR /home/dev/coupon-service

RUN set -x \
    && addgroup -g 1005 -S "dev" \
    && adduser -u 1005 -h "/home/dev" -s "/bin/sh" -g "dev" -S -G "dev" "dev"

COPY --from=development /home/dev/coupon-service/dist ./dist

COPY --from=development /home/dev/coupon-service/node_modules ./node_modules

USER artemis_user

CMD [ "node", "dist/main.js" ]