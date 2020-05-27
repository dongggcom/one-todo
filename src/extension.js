
/**
 * 插件被激活时触发，所有代码总入口
 * @param {*} context 插件上下文
 */
exports.activate = function(context) {
  console.log('恭喜，您的扩展“one-todo”已被激活！');
  require('./homepage')(context); // 首页
  require('./helloworld')(context); // hello word
};

/**
 * 插件被释放时触发
 */
exports.deactivate = function() {
  console.log('您的扩展“one-todo”已被释放！');
}