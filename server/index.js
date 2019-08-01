const Koa = require('koa');

const app = new Koa();

app.use(async ctx => {
  ctx.body = '<div>Hello benyl</div>';
});

module.exports = app;