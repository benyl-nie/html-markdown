const http = require('http');
const cheerio = require('cheerio');

const htmlCherroio = new Promise((resolve, reject) => {
  const pageUrl = 'http://www.mcake.com/shop/110/index.html#mainer_top';
  http.get(pageUrl, res => {
    const str =
  });
  console.log('1111http');
});

module.exports = htmlCherroio;


