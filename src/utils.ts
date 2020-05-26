import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 获取某个扩展文件绝对路径
 * @param context 上下文
 * @param relativePath 扩展中某个文件相对于根目录的路径，如 images/test.jpg
 */
export function getExtensionFileAbsolutePath (context: vscode.ExtensionContext, relativePath: string) :string {
  return path.join(context.extensionPath, relativePath);
}

/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
export function getWebViewContent(context: vscode.ExtensionContext, templatePath: string) :string {
  const resourcePath = getExtensionFileAbsolutePath(context, templatePath);
  const dirPath = path.dirname(resourcePath);
  let html = fs.readFileSync(resourcePath, 'utf-8');
  // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
  html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
      return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
  });
  return html;
}
