/**
 * confluence 转 markdown
 * @param: {url, cookie}
 * @output markdownStr
 * url -> 截取某个id内url -> 转成xml -> 循环遍历xml节点信息,边遍历边将指定节点信息转成markdown格式,遍历后至节点hasRead为true -> 输出markdownStr
 */

// const request = require('request');
const superagent = require('superagent');
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
  {key: 'table', value: ''},
  {key: 'tr', value: ''},
  {key: 'a', value: '[]()'},
  {key: 'ul', value: ''},
  {key: 'ol', value: ''},
  // {key: 'li', value: '*'},
  {key: 'img', value: '![]'},
  {key: 'br', value: `\n`},
  // {key: '#text', value: ''}
];

const blockLevelTag = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const tableNode = ['tr', 'td', 'th', 'table', 'tbody', 'thead'];
const thdTag = ['td', 'th'];
const lineFlagArr = ['#',  '', '|'];
let tdCount = 0;


// 根据url爬取页面
const getHtmlByUrl = async (href, cookies) => {
  return new Promise((resolve, reject) => {
    superagent.get(href)
              .set('Cookie', cookies)
              .end((err, res) => {
                if (err) console.info('get page error url => ' + href);
                html2Xml(res.text);
                // console.info(res.text);
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
    const currentTagFlag = blockLevelTag.indexOf(node.nodeName) > -1;
    const parentTagFlag = blockLevelTag.indexOf(node.parentNode.nodeName) > -1;
    // 块级元素整体换行
    if (lineFlagArr.indexOf(markdown.trim().substr(-1)) > -1 || (!currentTagFlag && parentTagFlag)) {
      markdownStr += `${markdown}`;
    } else if (markdownStr.trim().substr(-1) === '*' && markdownStr.trim().substr(-2) !== '**'){
      markdownStr += `    ${markdown}\n`;
    } else {
      markdownStr += `${markdown}\n`;
    }
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
        case 'table':
          md = table2Md(node) + `\n`;
          break;
        case 'strong':
          md = strong2Md(node, item);
          break;
        case 'p':
          md = p2Md(node, item) + `\n`;
          break;
        case 'ol':
          md = ul2Md(node, item);
          break;
        case 'ul':
          md = ul2Md(node, item);
          break;
        default:
          md = default2Md(node, item);
          break;
      }
      if (blockLevelTag.indexOf(node.nodeName) > -1) mds += `\n`;
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
  const tableFlag = filterTable(node);
  let md = ``;
  if (tableFlag) return '';

  const blockFlag = blockLevelTag.indexOf(node.nodeName) > -1;
  // 主体
  if (blockFlag) {
    md += blockFlag2Md(node, item);
  } else {
    let value = ``;
    for (let dIndex = 0; dIndex < node.childNodes.length; dIndex ++) {
      const ccnode = node.childNodes[dIndex];
      for (let ccIndex = 0; ccIndex < ccnode.length; ccIndex ++) {
        if (ccnode[ccIndex] && ccnode[ccIndex].hasRead) return;
        if (ccnode[ccIndex] && ccnode[ccIndex].nodeName === '#text') value += ccnode[ccIndex].data;
        // const thirdNode = ccnode[ccIndex].childNodes;
        // for (let thIndex = 0; thIndex < thirdNode.length; thIndex++) {
        //   if (thirdNode[thIndex] && thirdNode[thIndex].hasRead) return;
        //   if (thirdNode[thIndex] && thirdNode[thIndex].nodeName === '#text') value += ccnode[ccIndex].data;
        //   value +=  thirdNode[thIndex] && thirdNode[thIndex].nodeValue || '';
        // }
        value +=  ccnode[ccIndex] && ccnode[ccIndex].nodeValue || '';

      }
    }
    md = value === '' ? `${item.value} `  :  blockFlag ? `${item.value} ${value}\n` : `${item.value} ${value}`;



    // if (node.nodeName === '#text') {
    //   console.info(node.toString());
    //   value = node && node.data;
    // } else {
    //   value = (node.childNodes && node.childNodes[0] && node.childNodes[0].data) || (node && node.data) || '';
    // }
    // md = value === '' ?  `${item.value} `  :  blockFlag ? `${item.value} ${value}\n` : `${item.value} ${value}`;
  }
  node.hasRead = true;
  // md += `\n`;
  return md;
}

blockFlag2Md = (node, item) => {
  if (node.hasRead) return '';

  let md = `${item.value} `;
  for (let index = 0; index < node.childNodes.length; index ++) {
    if (node.childNodes[index].hasRead) return;
    if (node.childNodes[index].nodeName === '#text') md += node.childNodes[index].data;
    md += xml2Md(node.childNodes[index]);
    node.childNodes[index].hasRead = true;
  }
  node.hasRead = true;
  return md;
}

const img2Md = (node, item) => {
  if (node.hasRead) return '';

  const tableFlag = filterTable(node);
  if (tableFlag) return '';

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

  const tableFlag = filterTable(node);
  if (tableFlag) return '';

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

  const tableFlag = filterTable(node);
  if (tableFlag) return '';

  let md = ``;
  const parentSubFlag = blockLevelTag.indexOf(node.parentNode) <= -1 && node.parentNode.nextSibling;
  const value = (node.childNodes && node.childNodes[0] && node.childNodes[0].data) || (node && node.data) || '';
  if (value.trim() === '' || value === undefined || !value) return '';
  md += value === '' ? '' : parentSubFlag ? `  **${value}**  ` : `  **${value}**   \n`  ;
  node.hasRead = true;
  return md;
}

const p2Md = (node, item) => {
  // 过滤已读
  if (node.hasRead) return '';

  //  过滤table
  const tableFlag = filterTable(node);
  if (tableFlag) return '';


  const nodeChild = node.childNodes;
  let md = ``;
  for (let index = 0; index < nodeChild.length; index ++) {
    if (nodeChild[index].hasRead) return;
    if (nodeChild[index].nodeName === '#text') {
      md += nodeChild[index].data;
    } else {
      const ccnode = nodeChild[index].childNodes;
      for (let ccIndex = 0; ccIndex < ccnode.length; ccIndex ++) {
        if (ccnode[ccIndex].nodeName === '#text') md += ccnode[ccIndex].data;
        md += xml2Md(ccnode[ccIndex]);
      }


      // console.info(nodeChild[index].nodeName);
      // if (nodeChild[index].nodeName === 'span') {
      //   console.info(md);
      //   md += xml2Md(node.childNodes[index].childNodes);
      //   console.info(node.childNodes[index].childNodes.length);
      //   console.info('*********************************');
      //   console.info(md);
      //   console.info('*********************************');
      // } else {
      //   md += xml2Md(node.childNodes[index]);
      // }

      // console.info(node.childNodes[index].toString());
      // console.info('*********************************');
      // console.info(md);
      // console.info('*********************************');
    }

    // console.info(md);
    // console.info('*********************************');
    nodeChild[index].hasRead = true;
    // console.info(md);
  }

  node.hasRead = true;

  // for (let nodeIndex = 0; nodeIndex < nodeLen; nodeIndex ++) {
  //   const flag = tagHtml.filter(item => item.key === node.childNodes[nodeIndex].nodeName);
  //   if (flag.length > 0) {
  //     md += xml2Md(node.childNodes[nodeIndex]);
  //   } else {
  //     const pDom = new xmlDom().parseFromString(node.childNodes[nodeIndex].toString());
  //     const pNode = xpath.select("//text()", pDom);
  //     for (let pIndex = 0; pIndex < pNode.length; pIndex ++) {
  //       md += pNode[pIndex].nodeValue;
  //       pNode[pIndex].hasRead = true;
  //     }
  //   }
  //   node.childNodes[nodeIndex].hasRead = true;
  // }
  return md;
}

const ul2Md = (node, item) => {
  if (node.hasRead) return '';

  let key = `*`, ulMd = ``; // 默认为无序列表
  if (item.key === 'ol') key = [];
  ulMd += node.parentNode.nodeName === 'li' ? `\n    ` : ''
  for (let index = 0; index < node.childNodes.length; index ++) {
    if (node.childNodes[index].hasRead) return;
    ulMd += `${key === '*' ? '*' : `${index + 1}、`} ${li2Md(node && node.childNodes && node.childNodes[index], key)} \n`;
    node.childNodes[index].hasRead = true;
  }
  node.hasRead = true;
  return ulMd;
  // let md = li2Md(node && node.childNodes);
}

const li2Md = (node, key) => {
  if (node.hasRead) return '';

  let limd = ``;
  for (let index = 0; index < node.childNodes.length; index ++) {
    if(node.childNodes[index].hasRead)  return;

    if (node.childNodes[index].nodeName === '#text') {
      limd += `${node.childNodes[index].data}`
    } else {
      limd += xml2Md(node.childNodes[index]);
    }

    node.childNodes[index].hasRead = true;
  }

  node.hasRead = true;
  return limd;
  // console.info('*********************');
}



const table2Md = (node) => {
  if (node.hasRead) return '';
  let nodestr = node.toString();

  // table元素闭合问题
  nodestr = nodestr.replace('</table>', '');
  nodestr = nodestr.replace('</tbody>', '</tbody></table>');
  nodestr = nodestr.substr(0, nodestr.indexOf('</table>')) + '</table>';

  let tbodymd = `${tbody2Md(nodestr)}` || ``;
  node.hasRead = true;
  return tbodymd;
}

const tbody2Md = (nodestr) => {
  const node = new xmlDom().parseFromString(nodestr);
  if (node.hasRead) return '';
  const tableClass = xpath.select1("/table/@class", node) && xpath.select1("/table/@class", node) && xpath.select1("/table/@class", node).value;

  let tbodymd = ``;
  if (tableClass && tableClass.indexOf('confluenceTable') > -1) {
    // table
    tbodymd += `\n ${nodestr} \n`;
    node.hasRead = true;
  } else {
    // code
    const trDom = new xmlDom().parseFromString(nodestr);
    const trxpath = xpath.select('//tr', trDom);
    for (let trIndex = 0; trIndex < trxpath.length; trIndex ++) {
      tbodymd += codeTrMd(trxpath[trIndex]);
      trxpath[trIndex].hasRead = true;
    }
  }
  node.hasRead = true;
  return tbodymd;
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

const filterTable = (node) => {
  const tdNode = findtd(node);
  if (!tdNode) return false;
  const filClass = xpath.select1('//td/@class', tdNode);
  const thClass = xpath.select1('//th/@class', tdNode);
  if (filClass && (filClass.value.indexOf('confluenceT') > -1 || thClass.value.indexOf('confluenceT') > -1)) return true;
  return false;
}

findtd = (node) => {
  const parent_node = node.parentNode;
  const pppnode = parent_node && parent_node.parentNode;
  const forthnode = pppnode && pppnode.parentNode;
  if (node && thdTag.indexOf(node.nodeName) > -1) return node;
  if (parent_node && thdTag.indexOf(parent_node.nodeName) > -1) return parent_node;
  if (pppnode && thdTag.indexOf(pppnode.nodeName) > -1) return pppnode;
  if (forthnode && thdTag.indexOf(forthnode.nodeName) > -1) return forthnode;
  return false;
}

const htmlEncode = (str) => {
  return str.replace(/[<>"&\/`']/g, '');
}

const cookie = '';
module.exports = getHtmlByUrl('www.baidu.com', cookie);
// module.exports = html2Xml(demostr);