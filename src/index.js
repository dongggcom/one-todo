const vscode = require('vscode');

/**
 * 插件被激活时触发，所有代码总入口
 * @param {*} context 插件上下文
 */
exports.activate = function(context) {
  console.log('恭喜，您的扩展“one-todo”已被激活！');
  require('./homepage')(context); // 首页

};