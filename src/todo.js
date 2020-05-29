const vscode = require('vscode');
const window = vscode.window;
const workspace = vscode.workspace;


module.exports = (context) => {
  const activeEditor = window.activeTextEditor;
  const workspaceState = context.workspaceState;
  const settings = workspace.getConfiguration('oneTodo');

  let timeout = null;

  const { 
    pattern, // 关键字正则
    decorationTypes, // 关键字匹配样式
    assembledData, // 格式化后的装载数据
  } = init(settings)
  
  // 初始化编辑器
  if (activeEditor) {
    triggerUpdateDecorations();
  }

  // 编辑器变化时
  window.onDidChangeActiveTextEditor(function (editor) {
    if (activeEditor) {
        triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  // 编辑器结束变化时
  workspace.onDidChangeTextDocument(function (event) {
    if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  context.subscriptions.push(vscode.commands.registerCommand('extension.main.showAllAnnotations', function () {
    if (isEmtpy(assembledData)) return;

    const availableAnnotationTypes = Object.keys(assembledData);
    availableAnnotationTypes.unshift('ALL');
    chooseAnnotationType(availableAnnotationTypes).then(function (annotationType) {
        if (isEmtpy(annotationType)) return;
        var searchPattern = pattern;
        if (annotationType != 'ALL') {
            annotationType = escapeRegExp(annotationType);
            searchPattern = new RegExp(annotationType);
        }
        // util.searchAnnotations(workspaceState, searchPattern, util.annotationsFound);
    });
    
}));

  // 更新着色
  function updateDecorations() {

    if (!activeEditor || !activeEditor.document) {
        return;
    }
    const text = activeEditor.document.getText();
    const mathes = {};
    let match;
    while (match = pattern.exec(text)) {
        const startPos = activeEditor.document.positionAt(match.index);
        const endPos = activeEditor.document.positionAt(match.index + match[0].length);
        const decoration = {
            range: new vscode.Range(startPos, endPos)
        };

        const matchedValue = match[0];

        if (mathes[matchedValue]) {
            mathes[matchedValue].push(decoration);
        } else {
            mathes[matchedValue] = [decoration];
        }

    }

    Object.keys(decorationTypes).forEach((v) => {
        var rangeOption = mathes[v];
        var decorationType = decorationTypes[v];
        activeEditor.setDecorations(decorationType, rangeOption);
    })
  }
  
  // 触发着色
  function triggerUpdateDecorations() {
    timeout && clearTimeout(timeout);
    timeout = setTimeout(updateDecorations, 0);
  }


  // 查询注解
  // function searchAnnotations(workspaceState, pattern, callback) {
  //   const includePattern = getPathes(settings.get('include')) || '{**/*}';
  //   const excludePattern = getPathes(settings.get('exclude'));
  //   const limitationForSearch = settings.get('maxFilesForSearch', 5120);

  //   var statusMsg = ` Searching...`;

  //   window.processing = true;

  //   setStatusMsg(zapIcon, statusMsg);

  //   workspace.findFiles(includePattern, excludePattern, limitationForSearch).then(function (files) {

  //       if (!files || files.length === 0) {
  //           callback({ message: 'No files found' });
  //           return;
  //       }

  //       var totalFiles = files.length,
  //           progress = 0,
  //           times = 0,
  //           annotations = {},
  //           annotationList = [];

  //       function file_iterated() {
  //           times++;
  //           progress = Math.floor(times / totalFiles * 100);

  //           setStatusMsg(zapIcon, progress + '% ' + statusMsg);

  //           if (times === totalFiles || window.manullyCancel) {
  //               window.processing = true;
  //               workspaceState.update('annotationList', annotationList);
  //               callback(null, annotations, annotationList);
  //           }
  //       }

  //       for (var i = 0; i < totalFiles; i++) {

  //           workspace.openTextDocument(files[i]).then(function (file) {
  //               searchAnnotationInFile(file, annotations, annotationList, pattern);
  //               file_iterated();
  //           }, function (err) {
  //               errorHandler(err);
  //               file_iterated();
  //           });

  //       }
        
  //   }, function (err) {
  //       errorHandler(err);
  //   });
  // }

  // 初始化
  function init(settings) {
    const decorationTypes = {} // 着色映射
    const DEFAULT_KEYWORDS = {
      "#note-todo:": {
          text: "#note-todo:",
          color: '#fff',
          backgroundColor: '#40a9ff',
          overviewRulerColor: 'rgba(64,169,255,0.8)'
      }
    };

    const keywords = Object.keys(DEFAULT_KEYWORDS);
    const patternString = keywords.map(kw => {
      // 生成映射
      decorationTypes[kw] = window.createTextEditorDecorationType({
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        ...DEFAULT_KEYWORDS[kw],
      });
      return escapeRegExp(kw)
    }).join('|')

    const pattern = new RegExp(patternString, 'gi');
    
    const assembledData = DEFAULT_KEYWORDS

    return {
      pattern,
      decorationTypes,
      assembledData,
    }
  }
}

//get the include/exclude config
function getPathes(config) {
  return Array.isArray(config) ?
      '{' + config.join(',') + '}'
      : (typeof config == 'string' ? config : '');
}

function escapeRegExp(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function chooseAnnotationType(availableAnnotationTypes) {
  return window.showQuickPick(availableAnnotationTypes, {});
}

function isEmtpy(value) {
  if (!value) { // undefined null '' NaN
    return true;
  }
  return !Object.keys(value).length // [] {}
}
