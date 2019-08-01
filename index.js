const app = require('./server/index');

app.listen(9000, () => {
  console.log(`node服务已经启动, 请访问localhost:9000`)
});