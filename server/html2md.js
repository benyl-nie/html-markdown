const request = require('request');
const cheerio = require('cheerio');
// const lodash = require('lodash');
const xpath = require('xpath');
const xmlDom = require('xmldom').DOMParser;

const demostr = require('./tpl/ftl');
const httpUrl = 'https://wiki.maoyan.com';

let markdownStr = ``;

const tagHtml = [
  {key: 'h1', value: '#'},
  {key: 'h2', value: '##'},
  {key: 'h3', value: '###'},
  {key: 'h4', value: '####'},
  {key: 'h5', value: '#####'},
  {key: 'h6', value: '######'},
  {key: 'strong', value: '#####'},
  {key: 'hr', value: '---'},
  {key: 'p', value: ''},
  {key: 'span', value: ''},
  {key: 'br', value: ''},
  // {key: 'div', value: ''},
  // {key: 'table', value: ''},
  {key: 'thead', value: ''},
  {key: 'tbody', value: ''},
  // {key: 'tr', value: ''},
  // {key: 'th', value: ''},
  // {key: 'td', value: ''},
  {key: 'a', value: '[]()'},
  {key: 'ul', value: ''},
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
    length = doc.childNodes && doc.childNodes.length ;
    // console.log(length);
    for (let nodeIndex = 0; nodeIndex < length; nodeIndex ++) {
      deepTraversal(doc.childNodes[nodeIndex]);
    }
   console.info(markdownStr);
   return markdownStr;

  });
};

const deepTraversal = (node) => {
  let nodes = [];
  if (node !== null) {
    nodes.push(node);
    let children = node.childNodes;
    // console.log(xml2Md(node).trim() === 'undefined');
    const markdown = xml2Md(node);
    // markdown.trim().replace('undefined', '');
    markdownStr += `${xml2Md(node)} \n` ;
    markdownStr = markdownStr.replace('undefined', '');
    markdownStr = markdownStr.replace(`\n\n`, '');
    // if (markdown.trim() !== 'undefined') {

    // } else if ()

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
        mds += `${item.value}(${imgSrc})`;
      } else if (item.key === 'a') {
        let alink = '';
        for (let aIndex = 0; aIndex < node.attributes.length; aIndex ++) {
            const aItem = node.attributes[aIndex];
            if (aItem.nodeName === 'href') {
              alink = aItem.nodeValue;
            }
        }
        if (alink.substr(0,1) === '/') alink = `${httpUrl}${alink}`;
        alink = `[${node.childNodes[0].data}](${alink})`;
        mds += `${alink}`;
      } else if (item.key === 'thead') {
        // let theadmd = ``;
        // theadmd += table2Md(node, 'thead');
        // mds += theadmd;
      } else if (item.key === 'tbody') {
        // let theadmd = ``;
        // theadmd += table2Md(node, 'tbody');
        // mds += theadmd;
      } else {
        let md = `${item.value} ${(node.childNodes && node.childNodes[0] && node.childNodes[0].data) || (node && node.data)}`;
        mds += md;
      }
    }
    // mds += `\n`;
  });

  return mds;
};

const table2Md = (node, type) => {
  const theadAttr = node.attributes;
  if (type === 'tbody') {
    let tbodymd = tbody2Md(node) || ``;
    return tbodymd;
  } else {
    for (let attrIndex = 0; attrIndex < theadAttr.length; attrIndex ++) {
      if (theadAttr[attrIndex].nodeName === 'class' && theadAttr[attrIndex].nodeValue === 'tableFloatingHeaderOriginal') {
        let theadmd = thead2Md(node) || ``;
        return theadmd;
      }
    }
  }
}

const thead2Md = (node) => {
  const dom = new xmlDom().parseFromString(node.toString());
  const divxpath = xpath.select("//div", dom);
  let theadmd = ``;
  for(let t = 0; t < divxpath.length; t++) {
    theadmd += `${divxpath[t].childNodes[0].data} |`
  }
  theadmd += `\n`;
  for(let t = 0; t < divxpath.length; t++) {
    theadmd += `------------ |`
  }
  theadmd += `\n`
  // console.info(theadmd);
  return theadmd;
}

const tbody2Md = (node) => {
  // console.info(node.toString());
  const trDom = new xmlDom().parseFromString(node.toString());
  const trxpath = xpath.select('//tr', trDom);
  let tbodymd = ``;
  for (let trIndex = 0; trIndex < trxpath.length; trIndex ++) {
    tbodymd += tr2Md(trxpath[trIndex]);
    // console.log(`****************start*************`);
    // console.info(trxpath[trIndex]);
    // console.log(`****************over*************`);
  }
}

const tr2Md = () => {

}



// module.exports = getHtmlByUrl('https://www.baidu.com/');
module.exports = html2Xml(demostr);