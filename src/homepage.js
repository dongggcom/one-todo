const vscode = require("vscode");
const utils = require('./utils');
const { getWebViewContent, messageHandler } = utils;

module.exports = function (context) {
  // 注册命令
  context.subscriptions.push(vscode.commands.registerCommand('extension.main.showHomepage', () => {
    const panel = vscode.window.createWebviewPanel(
      'homepage', 
      "one-todo 首页", 
      vscode.ViewColumn.One, {
        // enableScripts: true, // 启用JS，默认禁用
      }
    );
    // let global = { panel };
    panel.webview.html = getWebViewContent(context, 'src/views/homepage.html');
    // panel.webview.onDidReceiveMessage(message => {
    //   if (messageHandler[message.cmd]) {
    //     messageHandler[message.cmd](global, message);
    //   } else {
    //     utils.showError(`未找到名为 ${message.cmd} 回调方法!`);
    //   }
    // }, undefined, context.subscriptions);
    // 读取配置
    // if (vscode.workspace.getConfiguration().get('oneTodo.showHomepage')) {
    //   vscode.commands.executeCommand('extension.main.showHomepage');
    // }
  }));
}
