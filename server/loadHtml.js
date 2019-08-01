const request = require('request');

const getHtmlByUrl = (href) => {
  return new Promise((resolve, reject) => { 
    request(href, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        console.log(body);// body即为目标页面的html
        resolve();
      } else {
        console.log('get page error url => ' + href);
        reject();
      }
    });
  });
}

module.exports = getHtmlByUrl('https://www.baidu.com/');


