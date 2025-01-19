FROM postgres:14

RUN apt-get update && apt-get install -y curl build-essential

ENV PG_UUIDV7_VERSION=1.5.0
ENV TEMP_DIR=/tmp/pg_uuidv7

RUN mkdir -p $TEMP_DIR && \
    cd $TEMP_DIR && \
    curl -LO "https://github.com/fboulnois/pg_uuidv7/releases/download/v${PG_UUIDV7_VERSION}/pg_uuidv7.tar.gz" && \
    curl -LO "https://github.com/fboulnois/pg_uuidv7/releases/download/v${PG_UUIDV7_VERSION}/SHA256SUMS"

RUN cd $TEMP_DIR && \
    tar xf pg_uuidv7.tar.gz && \
    sha256sum -c SHA256SUMS && \
    ls -lR $TEMP_DIR

RUN cd $TEMP_DIR && \
    PG_MAJOR=$(pg_config --version | sed 's/^.* \([0-9]\{1,\}\).*$/\1/') && \
    cp $TEMP_DIR/14/pg_uuidv7.so $(pg_config --pkglibdir) && \
    cp $TEMP_DIR/pg_uuidv7.control $(pg_config --sharedir)/extension && \
    cp $TEMP_DIR/pg_uuidv7--1.5.sql $(pg_config --sharedir)/extension

RUN rm -rf $TEMP_DIR
