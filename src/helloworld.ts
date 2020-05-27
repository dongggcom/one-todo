import * as vscode from 'vscode';

export default function helloworld(context: vscode.ExtensionContext) {
  // 注册命令
  context.subscriptions.push(vscode.commands.registerCommand('extension.sayHello', () => {
    vscode.window.showInformationMessage('Hi! This is ONE-TODO!');
  }))
}