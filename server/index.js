const Koa = require('koa');

const app = new Koa();

app.use(ctx => {
  ctx.body = '<div>Hello benyl</div>';
});

module.exports = app;