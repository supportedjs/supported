'use strict';

const Koa = require('koa');
const fs = require('fs');
const resolve = require('resolve-path');
const { extname } = require('path');
const BASE_PORT = 3000;

// disable inherited registry (when calling yarn <run> you get this set...)
delete process.env.npm_config_registry;
module.exports = server;
function server(recordingRoot, port) {
  const app = new Koa();

  app.use(async (ctx, next) => {
    if (ctx.method === 'GET') {
      let urlSplit = ctx.url.split('/');
      let file = urlSplit[urlSplit.length - 1];
      // check if the request is for a specific file.
      if (extname(file) || file === '.npmrc') {
        file = resolve(recordingRoot, file);
      } else {
        const moduleName = ctx.url.slice(1);
        // use resolve-path to prevent directory traversal
        file = resolve(recordingRoot, `${moduleName}.json`);
      }
      if (fs.existsSync(file)) {
        ctx.body = fs.readFileSync(file, 'UTF8');
      } else {
        ctx.throw(
          404,
          JSON.stringify({
            error: {
              code: 'E404',
              summary: '',
              details: '',
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
  const root = `${__dirname}/../fixtures`;
  let registries = null;
  module.exports.startAll = function (additionalRegistries = []) {
    if (registries !== null) {
      throw new Error('already started');
    }
    registries = Object.create(null);
    // default registry
    registries.default = server(`${root}/recordings/default`, BASE_PORT);

    // registry for the @stefanpenner scope
    registries.stefanpenner = server(`${root}/recordings/stefanpenner`, BASE_PORT + 1);
    // if developers want to add more server while extending
    additionalRegistries.forEach(({ name, recordingRoot, port }, index) => {
      port = port || BASE_PORT + 2 + index;
      registries[name] = server(recordingRoot, port);
    });
  };

  module.exports.stopAll = function () {
    if (registries == null) {
      throw new Error('not yet started');
    }

    for (const listener of Object.values(registries)) {
      listener.close();
    }
    registries = null;
  };
}
