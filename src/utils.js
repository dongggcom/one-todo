const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * 弹出错误信息
 */
function showError(info) {
  vscode.window.showErrorMessage(info);
}

/**
 * 弹出提示信息
 */
function showInfo(info) {
  vscode.window.showInformationMessage(info);
}

/**
 * 获取某个扩展文件绝对路径
 * @param context 上下文
 * @param relativePath 扩展中某个文件相对于根目录的路径，如 images/test.jpg
 */
function getExtensionFileAbsolutePath (context, relativePath) {
  return path.join(context.extensionPath, relativePath);
}

/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
function getWebViewContent(context, templatePath) {
  try {
    const resourcePath = getExtensionFileAbsolutePath(context, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });
    return html;
  } catch(e) {
    console.warn('get webview fail!', e)
    return ''
  }
}

/**
 * 执行回调函数
 * @param {*} panel 
 * @param {*} message 
 * @param {*} resp 
 */
function invokeCallback(panel, message, resp) {
  console.log('回调消息：', resp);
  // 错误码在400-600之间的，默认弹出错误提示
  if (typeof resp == 'object' && resp.code && resp.code >= 400 && resp.code < 600) {
      showError(resp.message || '发生未知错误！');
  }
  panel.webview.postMessage({cmd: 'vscodeCallback', cbid: message.cbid, data: resp});
}

/**
* 存放所有消息回调函数，根据 message.cmd 来决定调用哪个方法
*/
const messageHandler = {
  getConfig(global, message) {
      const result = vscode.workspace.getConfiguration().get(message.key);
      invokeCallback(global.panel, message, result);
  },
  setConfig(global, message) {
      // 写入配置文件，注意，默认写入工作区配置，而不是用户配置，最后一个true表示写入全局用户配置
      vscode.workspace.getConfiguration().update(message.key, message.value, true);
      showInfo('修改配置成功！');
  }
};


module.exports = {
  getExtensionFileAbsolutePath,
  getWebViewContent,
  messageHandler,
  showError,
  showInfo,
}