/**
 * confluence 转 markdown
 * @param: {url, cookie}
 * @output markdownStr
 * url -> 截取某个id内url -> 转成xml -> 循环遍历xml节点信息,边遍历边将指定节点信息转成markdown格式,遍历后至节点hasRead为true -> 输出markdownStr
 */

const request = require('request');
const cheerio = require('cheerio');
const xpath = require('xpath');
const xmlDom = require('xmldom').DOMParser;

const demostr = require('./tpl/ftl');
const httpUrl = 'https://wiki.maoyan.com';

let markdownStr = ``;

const IMGSRC = 'data-image-src';
const BASEURL = 'data-base-url';


const tagHtml = [
  {key: 'h1', value: '#'},
  {key: 'h2', value: '##'},
  {key: 'h3', value: '###'},
  {key: 'h4', value: '####'},
  {key: 'h5', value: '#####'},
  {key: 'h6', value: '######'},
  {key: 'strong', value: '**'},
  {key: 'hr', value: '---'},
  {key: 'p', value: ''},
  {key: 'span', value: ''},
  {key: 'pre', value: ''},
  {key: 'br', value: ''},
  {key: 'thead', value: ''},
  {key: 'tbody', value: ''},
  {key: 'a', value: '[]()'},
  {key: 'ul', value: ''},
  {key: 'li', value: '*'},
  {key: 'img', value: '![]'},
  {key: 'br', value: `\n`},
  // {key: '#text', value: ''}
];

const blockLevelTag = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const textLevelTag = ['span', '#text', 'br', 'pre', 'a', 'b', 'label', 'strong'];
const tableNode = ['tr', 'td', 'th'];
const lineFlagArr = ['#',  '', '|'];


// 根据url爬取页面
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
    for (let nodeIndex = 0; nodeIndex < length; nodeIndex ++) {
      deepTraversal(doc.childNodes[nodeIndex]);
    }
   console.info(markdownStr);
   return markdownStr;
  });
};

const deepTraversal = (node) => {
  let nodes = [];

  /**
   *  过滤目录
   *  过滤code中toolbar div
   * */
  const marcDom = new xmlDom().parseFromString(node.toString());
  const marcNode = xpath.select1("/div/@class", marcDom);
  if ((marcNode !== undefined && marcNode.value.indexOf('toc') > -1) || (marcNode !== undefined && marcNode.value === 'toolbar')) {
    return;
  }

  if (node !== null) {
    nodes.push(node);
    let children = node.childNodes;
    const markdown = xml2Md(node);
    // textLevelTag.indexOf(node.nodeName) > -1 ||
    // 块级元素整体换行
    if (lineFlagArr.indexOf(markdown.trim().substr(-1)) > -1 || blockLevelTag.indexOf(node.parentNode.nodeName) > -1) {
      markdownStr += `${markdown}`;
    } else {
      markdownStr += `${markdown}\n`;
    }
    // markdownStr +=  (markdown.trim().substr(-1) === '#' || markdown.trim().substr(-1) === '*' || markdown === '' || markdown.trim().substr(-1) === '|') ? `${markdown}` : `${markdown}\n` ;
    // markdownStr = markdownStr.replace(`\n\n`, '');
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
      let md = ``;
      switch(item.key) {
        case 'img':
          md = img2Md(node, item);
          break;
        case 'a':
          md = a2Md(node, item);
          break;
        case 'thead':
          md = table2Md(node, 'thead');
          break;
        case 'tbody':
          md = table2Md(node, 'tbody') + `\n`;
          break;
        case 'strong':
          md = strong2Md(node, item);
          break;
        case 'p':
          md = p2Md(node, item);
          break;
        case 'li':
            md = li2Md(node, item);
          break;
        default:
          md = default2Md(node, item);
          break;
      }
      mds += md;
    }
  });
  mds.replace(`\n`, '');
  return mds;
};

const default2Md = (node, item) => {
  // 已读节点不再读取
  if (node.hasRead) return '';
  /**
   * 过滤由table带过来的遍历
   */
  const parentDom = new xmlDom().parseFromString(node.parentNode.toString());
  const parentClass = xpath.select1("//@class", parentDom) && xpath.select1("//@class", parentDom).nodeValue;
  if (parentClass && parentClass.indexOf('table') > -1) return '';
  if (tableNode.indexOf(node.parentNode.nodeName) > -1) return '';
  // 主体
  const value = (node.childNodes && node.childNodes[0] && node.childNodes[0].data) || (node && node.data) || '';
  const md = value !== '' ? `${item.value} ${value}` : `${item.value} `;
  node.hasRead = true;
  return md;
}

const img2Md = (node, item) => {
  if (node.hasRead) return '';
  let attrLen = node.attributes.length;
  let imgBase = '', imgSour = '', imgSrc = '';
  for (let attrIndex = 0; attrIndex < attrLen; attrIndex ++) {
    const attrItem = node.attributes[attrIndex];
    if (attrItem.nodeName === IMGSRC) imgSour = attrItem.nodeValue;
    if (attrItem.nodeName === BASEURL) imgBase = attrItem.nodeValue;
    imgSrc = imgBase + imgSour;
  }
  node.hasRead = true;
  return `${item.value}(${imgSrc})`;
}

const a2Md = (node, item) => {
  if (node.hasRead) return '';
  let alink = '';
  for (let aIndex = 0; aIndex < node.attributes.length; aIndex ++) {
      const aItem = node.attributes[aIndex];
      if (aItem.nodeName === 'href') {
        alink = aItem.nodeValue;
      }
  }
  if (alink.substr(0,1) === '/') alink = `${httpUrl}${alink}`;
  alink = `[${node.childNodes[0].data}](${alink})`;
  node.hasRead = true;
  return`${alink}`;
}

const strong2Md = (node, item) => {
  if (node.hasRead) return '';
  let md = ``;
  const value = (node.childNodes && node.childNodes[0] && node.childNodes[0].data) || (node && node.data) || '';
  if (value.trim() === '' || value === undefined || !value) return '';
  for (let boldAttrIndex = 0; boldAttrIndex < node.childNodes.length; boldAttrIndex ++) {
    // console.info(node.childNodes[boldAttrIndex]);
    // mds += xml2Md(node.childNodes[boldAttrIndex]);
  }
  md += value === '' ? '' : `**${value}**`;
  node.hasRead = true;
  return md;
}

const p2Md = (node, item) => {
  if (node.hasRead) return '';

  const nodeLen = node.childNodes.length;
  let md = ``;
  for (let nodeIndex = 0; nodeIndex < nodeLen; nodeIndex ++) {
    const flag = tagHtml.filter(item => item.key === node.childNodes[nodeIndex].nodeName);
    if (flag.length > 0) {
      md += xml2Md(node.childNodes[nodeIndex]);
    } else {
      const pDom = new xmlDom().parseFromString(node.childNodes[nodeIndex].toString());
      const pNode = xpath.select("//text()", pDom);
      for (let pIndex = 0; pIndex < pNode.length; pIndex ++) {
        md += pNode[pIndex].nodeValue;
        pNode[pIndex].hasRead = true;
      }
    }
    node.childNodes[nodeIndex].hasRead = true;
  }
  return md;
}

li2Md = (node, item) => {
  if (node.hasRead) return '';
  let md = ` `;
  // console.info(node.toString());
  for (let index = 0; index < node.childNodes.length; index ++) {
    if (node.childNodes[index].hasRead) return '';
    const nodeName = node.childNodes[index].nodeName;
    const exitFlag = tagHtml.filter(item => item.key === nodeName);
    if (exitFlag.length > 0) {
      console.log('*************************');
      if (nodeName === 'ul') { // 二级或者三级
         console.info(node.childNodes[index].toString());
        // const listTwo = node.childNodes[index].parentNode.nodeName === 'li';
        const listThree = node.childNodes[index].parentNode.parentNode.parentNode && node.childNodes[index].parentNode.parentNode.parentNode.nodeName === 'li';
        // console.info(listThree);
        md += listThree ? `\n          *` : `\n    *`;
        // console.info(`${nodeName}      ${listThree}`);
        console.info(md);
        console.log('***********mdmdmdmmd**************');
      }
      // let mdStr = xml2Md(node.childNodes[index]);
      // console.info(mdStr);
      md += xml2Md(node.childNodes[index]);
      console.info(md);
    } else {
      md += `* ${node.childNodes[index].nodeValue}`;
    }
    node.childNodes[index].hasRead = true;
  }
  node.hasRead = true;
  // md += `\n\n`;
  return md;
}

const table2Md = (node, type) => {
  if (node.hasRead) return '';

  const theadAttr = node.attributes;
  if (type === 'tbody') {
    let tbodymd = `\n ${tbody2Md(node)}` || ``;
    node.hasRead = true;
    return tbodymd;
  } else {
    for (let attrIndex = 0; attrIndex < theadAttr.length; attrIndex ++) {
      if (theadAttr[attrIndex].nodeName === 'class' && theadAttr[attrIndex].nodeValue === 'tableFloatingHeaderOriginal') {
        let theadmd = `\n ${thead2Md(node)}` || ``;
        node.hasRead = true;
        return theadmd;
      } else {
        let theadmd = '';
        node.hasRead = true;
        return theadmd;
      }
    }
  }
}

const thead2Md = (node) => {
  if (node.hasRead) return '';

  const dom = new xmlDom().parseFromString(node.toString());
  const divxpath = xpath.select("//tr", dom);
  let theadmd = ``, thdom = null, tdpath = null;
  for(let t = 0; t < divxpath.length; t++) {
    thdom = new xmlDom().parseFromString(divxpath[t].toString());
    tdpath = xpath.select("//th", thdom)
    for(let thIndex = 0; thIndex < tdpath.length; thIndex ++) {
      let tddom = new xmlDom().parseFromString(tdpath[thIndex].toString());
      const tdtext = xpath.select("//text()", tddom);
      theadmd += `${tdtext[0].nodeValue} |`
    }
    theadmd += `\n`;
  }
  for(let t = 0; t < divxpath.length; t++) {
    for(let thIndex = 0; thIndex < tdpath.length; thIndex ++) {
      theadmd += `------------ |`
    }
  }
  theadmd += `\n`
  return theadmd;
}

const tbody2Md = (node) => {
  if (node.hasRead) return '';

  const trDom = new xmlDom().parseFromString(node.toString());
  const trxpath = xpath.select('//tr', trDom);
  let tbodymd = ``;

  for (let trIndex = 0; trIndex < trxpath.length; trIndex ++) {
    if (trxpath[trIndex].toString().indexOf('code') > -1) {
      // code转化
      tbodymd += codeTrMd(trxpath[trIndex]);
    } else {
      tbodymd += tr2Md(trxpath[trIndex]);
    }
    trxpath[trIndex].hasRead = true;
  }
  node.hasRead = true;
  return tbodymd;
}

const tr2Md = (node) => {
  if(node.hasRead) return '';

  const tdDom = new xmlDom().parseFromString(node.toString());
  const tdpath = xpath.select("//td", tdDom);
  let trmd = ``;
  for (let tdIndex = 0; tdIndex < tdpath.length; tdIndex ++) {

    let tdmd = ``;
    tdmd = `${td2Md(tdpath[tdIndex])} |`;
    trmd += tdmd ;
  }
  trmd += `\n`;
  node.hasRead = true;
  return trmd;
}

td2Md = (node) => {
  if (node.hasRead) return '';

  const domtd = new xmlDom().parseFromString(node.toString());
  const domtdVal = xpath.select("//text()", domtd);
  let tdmd = ``;
  for(let tdmdIndex = 0; tdmdIndex < domtdVal.length; tdmdIndex ++) {
    tdmd += `${domtdVal[tdmdIndex].data}  `;
  }
  node.hasRead = true;
  return tdmd;
}

// code to markdown
const codeTrMd = (node) => {
  if (node.hasRead) return '';

  const tdDom = new xmlDom().parseFromString(node.toString());
  const tdpath = xpath.select("//td/div/div", tdDom);
  let codemd = '\n' + '```' + `\n`;
  for(let codeIndex = 0; codeIndex < tdpath.length; codeIndex ++) {
    const codeDom = new xmlDom().parseFromString(tdpath[codeIndex].toString());
    let mdValue = xpath.select("//code/text()", codeDom);

    for (let mdValueIndex = 0; mdValueIndex < mdValue.length; mdValueIndex ++) {
      codemd += mdValue[mdValueIndex].data;
    }
    codemd += `\n`;
  }
  codemd += '```\n';
  return codemd;
}

const htmlEncode = (str) => {
  return str.replace(/[<>"&\/`']/g, '');
}

// module.exports = getHtmlByUrl('https://www.baidu.com/');
module.exports = html2Xml(demostr);