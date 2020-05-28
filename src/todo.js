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

// 创造状态图标
function createStatusBarItem() {
  var statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  statusBarItem.text = defaultIcon + defaultMsg;
  statusBarItem.tooltip = 'List annotations';
  statusBarItem.command = 'todohighlight.showAllAnnotations';
  return statusBarItem;
};

//get the include/exclude config
function getPathes(config) {
  return Array.isArray(config) ?
      '{' + config.join(',') + '}'
      : (typeof config == 'string' ? config : '');
}

function setStatusMsg(icon, msg, tooltip) {
  if (window.statusBarItem) {
      window.statusBarItem.text = `${icon} ${msg}` || '';
      if (tooltip) {
          window.statusBarItem.tooltip = tooltip;
      }
      window.statusBarItem.show();
  }
}

function searchAnnotations(workspaceState, pattern, callback) {

  var settings = workspace.getConfiguration('oneTodo');
  var includePattern = getPathes(settings.get('include')) || '{**/*}';
  var excludePattern = getPathes(settings.get('exclude'));
  var limitationForSearch = settings.get('maxFilesForSearch', 5120);

  var statusMsg = ` Searching...`;

  window.processing = true;

  setStatusMsg(zapIcon, statusMsg);

  workspace.findFiles(includePattern, excludePattern, limitationForSearch).then(function (files) {

      if (!files || files.length === 0) {
          callback({ message: 'No files found' });
          return;
      }

      var totalFiles = files.length,
          progress = 0,
          times = 0,
          annotations = {},
          annotationList = [];

      function file_iterated() {
          times++;
          progress = Math.floor(times / totalFiles * 100);

          setStatusMsg(zapIcon, progress + '% ' + statusMsg);

          if (times === totalFiles || window.manullyCancel) {
              window.processing = true;
              workspaceState.update('annotationList', annotationList);
              callback(null, annotations, annotationList);
          }
      }

      for (var i = 0; i < totalFiles; i++) {

          workspace.openTextDocument(files[i]).then(function (file) {
              searchAnnotationInFile(file, annotations, annotationList, pattern);
              file_iterated();
          }, function (err) {
              errorHandler(err);
              file_iterated();
          });

      }
      
  }, function (err) {
      errorHandler(err);
  });
}

function init(settings) {
  if (!window.statusBarItem) {
    window.statusBarItem = createStatusBarItem();
  }

}