const Koa = require('koa');
const path = require('path');
const config = require('config');
const cookieParser = require('cookie-parser');
// const loadHtml = require('load-html');

const app = new Koa();

// app.use(cors({
//   //credentials: true,                //如果需要跨域那么需要设置这两个属性，表示服务器端接受这个域来的信息
//   //origin: 'http://localhost:8080'
// }));

app.use(cookieParser());

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