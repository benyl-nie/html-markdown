const request = require('request');
const html2markdown = require('to-markdown');
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

const html2Md = async (str) => {
  return new Promise((resolve, reject) => {

    let $ = cheerio.load(str);

    let contentStr = $('#main-content').html();
    console.log(`contentStr here start\n`);
    console.log(`\n\n\n`);
    console.info(contentStr);
    // $('#main-content .syntaxhighlighter').forEach((item, index) => {
    //   // try{
    //   //   // const codeMd = await codeToMd(item);
    //   //   console.info(codeMd);
    //   // } catch(e) {
    //   //   console.info(`code to markdown err`);
    //   // }
    // });
    console.log(`\n\n\n`);
    let mdstr = '';
    try {
      mdstr = html2markdown(contentStr);
      mdstr = mdstr.replace(/\/download/g, 'https://wiki.maoyan.com/download' );

    } catch(e) {
      console.info(`here log html2markdown errer ${e}`);
    }

    console.log(`mdstr here start\n`);
    console.log(`\n\n\n`);
    console.info(mdstr);
    console.log(`\n\n\n`);
    resolve();
  });
}

// const codeToMd = async (codeStr) => {
//   const
// }


// module.exports = getHtmlByUrl('https://www.baidu.com/');
module.exports = html2Md(demostr);


