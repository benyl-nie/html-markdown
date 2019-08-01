const request = require('request');
const html2markdown = require('html2markdown');
const cheerio = require('cheerio');
const demostr = require('./tpl/ftl');



const getHtmlByUrl = async (href) => {
  return new Promise((resolve, reject) => { 
    request(href, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        // console.log(body); // body即为目标页面的html
        html2Md(body);
        resolve();
      } else {
        console.log('get page error url => ' + href);
        reject();
      }
    });
  });
}

const html2Md = (str) => {
  return new Promise((resolve, reject) => {
    let $ = cheerio.load(str);

    const contentStr = $('#main').html();
    // console.info(contentStr);
    
    const mdstr = html2markdown(contentStr);
    console.info(mdstr);
    resolve();
  });
}


// module.exports = getHtmlByUrl('https://www.baidu.com/');
module.exports = html2Md(demostr);


