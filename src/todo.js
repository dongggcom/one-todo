const vscode = require('vscode');
const window = vscode.window;
const workspace = vscode.workspace;

module.exports = (context) => {
  const activeEditor = window.activeTextEditor;
  const workspaceState = context.workspaceState;
  const settings = workspace.getConfiguration('oneTodo');


}

var DEFAULT_KEYWORDS = {
  "note-todo:": {
      text: "note-todo:",
      color: '#fff',
      backgroundColor: '#ffbd2a',
      overviewRulerColor: 'rgba(255,189,42,0.8)'
  }
};

var defaultIcon = '$(checklist)';
var zapIcon = '$(zap)';
var defaultMsg = '0';

function createStatusBarItem() {
  var statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  statusBarItem.text = defaultIcon + defaultMsg;
  statusBarItem.tooltip = 'List annotations';
  statusBarItem.command = 'todohighlight.showOutputChannel';
  return statusBarItem;
};

function init() {}