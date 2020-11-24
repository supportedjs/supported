'use strict';

const Koa = require('koa');
const fs = require('fs');
const resolve = require('resolve-path');

// disable inherited registry (when calling yarn <run> you get this set...)
delete process.env.npm_config_registry;
module.exports = server;
function server(recordingRoot, port) {
  const app = new Koa();

  app.use(async (ctx, next) => {
    if (ctx.method === 'GET') {
      const moduleName = ctx.url.slice(1);
      // use resolve-path to prevent directory traversal
      const file = resolve(recordingRoot, `${moduleName}.json`);
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
  const root = `${__dirname}/fixtures`;
  let registries = null;
  module.exports.startAll = function () {
    if (registries !== null) {
      throw new Error('already started');
    }
    registries = Object.create(null);
    // default registry
    registries.default = server(`${root}/recordings/default`, 3000);

    // registry for the @stefanpenner scope
    registries.stefanpenner = server(`${root}/recordings/stefanpenner`, 3001);
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
