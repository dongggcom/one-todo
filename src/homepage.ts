import * as vscode from 'vscode';
import { getWebViewContent } from './utils';

export default (context: vscode.ExtensionContext) => {
  // 注册命令
  context.subscriptions.push(vscode.commands.registerCommand('extension.main.homepage', () => {
    
  }))
}