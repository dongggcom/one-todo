import * as vscode from 'vscode';
import homepageCreator from './homepage'

/**
 * 插件被激活时触发，所有代码总入口
 * @param {*} context 插件上下文
 */
export function activate (context: vscode.ExtensionContext) {
  console.log('恭喜，您的扩展“one-todo”已被激活！');
  homepageCreator(context); // 首页

};

