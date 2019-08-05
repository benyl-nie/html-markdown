const Koa = require('koa');
const path = require('path');
const config = require('config');
// const loadHtml = require('load-html');

const app = new Koa();

app.myUse = async (middlewareName) => {
  let app = this;
  let middleware = require(path.join(__dirname, middlewareName + '.js'));
  let promise = null;
  try {
    promise = await middleware(app, config);
  } catch(e) {
    console.info(`here load middlemare ${middleware} error`);
  }

  promise && app.use(promise, middleware);
  return app;
}

app.myUse('html2md');


module.exports = app;