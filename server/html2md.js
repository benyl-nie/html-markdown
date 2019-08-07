const request = require('request');
const cheerio = require('cheerio');
// const lodash = require('lodash');
const xpath = require('xpath.js');
const xmlDom = require('xmldom').DOMParser;

const demostr = require('./tpl/ftl');

let markdownStr = ``;

const tagHtml = [
  {key: 'h1', value: '#'},
  {key: 'h2', value: '##'},
  {key: 'h3', value: '###'},
  {key: 'h4', value: '####'},
  {key: 'h5', value: '#####'},
  {key: 'h6', value: '######'},
  {key: 'p', value: ''},
  {key: 'span', value: ''},
  {key: 'div', value: ''},
  {key: 'a', value: '[]()'},
  {key: 'li', value: '-'},
  {key: 'img', value: '![]'}
];

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
};

const html2Xml = async (str) => {
  return new Promise((resolve, reject) => {
    let $ = cheerio.load(str);
    let contentStr = $('#main-content').html();
    const doc = new xmlDom().parseFromString(contentStr);
    let length = 0;
    // if (doc && doc.childNodes && doc.childNodes.length > 0){
    //   length = doc.childNodes.length;
    // }
    length = doc.childNodes && doc.childNodes.length ;
    // console.log(length);

    for (let nodeIndex = 1; nodeIndex < 2; nodeIndex ++) {
      deepTraversal(doc.childNodes[nodeIndex]);
      // console.info(doc.childNodes[nodeIndex]);
    }
   console.info(markdownStr);
   return markdownStr;

  });
};

const deepTraversal = (node) => {
  console.log(`***********************start*********************\n\n`);
  console.info(node);
  console.log(`***********************end*********************\n\n`);
  let nodes = [];
  if (node !== null) {
    nodes.push(node);
    let children = node.childNodes;
    markdownStr += xml2Md(node);
    if (children) {
      for (let i = 0; i < children.length; i++ ) {
        deepTraversal(children[i]);
      }
    }
  }
  // return nodes;
};

const xml2Md = (node) => {
  let mds = ``;
  tagHtml.filter((item) => {
    const nodeName = node.nodeName;
    if (item.key === nodeName) {
      if (item.key === 'img') {
        let attrLen = node.attributes.length;
        let imgBase = '', imgSour = '', imgSrc = '';
        for (let attrIndex = 0; attrIndex < attrLen; attrIndex ++) {
          const attrItem = node.attributes[attrIndex];
          if (attrItem.nodeName === 'data-image-src') imgSour = attrItem.nodeValue;
          if (attrItem.nodeName === 'data-base-url') imgBase = attrItem.nodeValue;
          imgSrc = imgBase + imgSour;
        }
        mds += `${item.value}(${imgSrc})\n`;
      } else if (item.key === 'a') {
        // console.log(`***********************node.attributes start*********************\n\n`);
        // console.info(node.attributes);
        // console.log(`***********************node.attributes end*********************\n\n`);
        let alink = '', ades = '';
        for (let aIndex = 0; aIndex < node.attributes.length; aIndex ++) {
            const aItem = node.attributes[aIndex];
            if (aItem.nodeName === 'href') {
              alink = aItem.nodeValue;
            } 
        }
        alink = `[${node.childNodes[0],data}](#${alink})`;
        mds += `${alink} \n`;
      } else {
        mds += `${item.value} ${node.childNodes[0].data || node.data} \n`;
      }
    }
  });
  mds += `\n`;
  return mds;
};



// module.exports = getHtmlByUrl('https://www.baidu.com/');
module.exports = html2Xml(demostr);