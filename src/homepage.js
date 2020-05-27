const vscode = require('vscode');
// import { getWebViewContent } from './utils';
function getWebViewContent(context, relativePath) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
</body>
</html>`;
}

function homepageCreator(context) {
  console.log('homepage create success!')
  // 注册命令
  context.subscriptions.push(vscode.commands.registerCommand('extension.main.showHomepage', () => {
    const panel = vscode.window.createWebviewPanel(
      'homepage',
      "one-todo 首页",
      vscode.ViewColumn.One,
      {
        // enableScripts: true, // 启用JS，默认禁用
      }
    );
    console.log('in command', getWebViewContent(context, 'src/views/homepage.html'))
    // panel.webview.html = getWebViewContent(context, 'src/views/homepage.html');
    // // 读取配置
    // if (vscode.workspace.getConfiguration().get('oneTodo.showHomepage')) {
    //   vscode.commands.executeCommand('extension.main.showHomepage');
    // }
  }))
}
exports.default = homepageCreator