'use strict';

const Koa = require('koa');
const fs = require('fs');
const resolve = require('resolve-path');

function server(projectPath, port) {
  const app = new Koa();

  app.use(async (ctx, next) => {
    if (ctx.method === 'GET') {
      let urlSplit = ctx.url.split('/');
      const file = resolve(projectPath, urlSplit[urlSplit.length - 1]);
      if (fs.existsSync(file)) {
        ctx.body = fs.readFileSync(file, 'UTF8');
      } else {
        ctx.throw(
          404,
          JSON.stringify({
            error: {
              code: 'E404',
              summary: '',
              details: 'File not found',
            },
          }),
        );
      }
    } else {
      next();
    }
  });

  return app.listen(port);
}

{
  const root = `${__dirname}/fixtures`;
  let fileServer = null;
  const FILE_SERVER_PORT_1 = 3002;
  const FILE_SERVER_PORT_2 = 3003;

  let startAll = function () {
    if (fileServer !== null) {
      throw new Error('already started');
    }
    fileServer = Object.create(null);

    fileServer.supported = server(`${root}/supported-project`, FILE_SERVER_PORT_1);

    fileServer.fileNotFound = server(`${root}/not-found-project`, FILE_SERVER_PORT_2);
  };

  let stopAll = function () {
    if (fileServer == null) {
      throw new Error('not yet started');
    }

    for (const listener of Object.values(fileServer)) {
      listener.close();
    }
    fileServer = null;
  };

  module.exports = {
    startAll,
    stopAll,
    FILE_SERVER_PORT_1,
    FILE_SERVER_PORT_2,
    server,
  };
}
