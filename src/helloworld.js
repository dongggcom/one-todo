const vscode = require("vscode");

module.exports = function (context) {
  // 注册命令
  context.subscriptions.push(vscode.commands.registerCommand('extension.sayHello', () => {
      vscode.window.showInformationMessage('Hi! This is ONE-TODO!');
  }));
}
