const request = require('request');
const cheerio = require('cheerio');

const demostr = require('./tpl/ftl');

const getHtmlByUrl = async (href) => {
  return new Promise((resolve, reject) => {
    request(href, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        // console.log(body); // body即为目标页面的html
        try {
          await html2Md(body);
        } catch(e) {
          console.log(`html parse md err => ${e}`);
        }
        resolve();
      } else {
        console.log('get page error url => ' + href);
        reject();
      }
    });
  });
}

const html2Md = async (str) => {
  return new Promise((resolve, reject) => {
    let $ = cheerio.load(str);
    let contentStr = $('#main-content').html();
  });
}

// module.exports = getHtmlByUrl('https://www.baidu.com/');
module.exports = html2Md(demostr);