// @ts-nocheck

const vscode = require('vscode');
const os = require("os");
const window = vscode.window;
const workspace = vscode.workspace;

const defaultIcon = '$(checklist)'; // statusBar 图标
const zapIcon = '$(zap)';
const defaultMsg = '0';             // statusBar 

module.exports = (context) => {
  let activeEditor = window.activeTextEditor;
  const workspaceState = context.workspaceState;
  const settings = workspace.getConfiguration('oneTodo');

  let timeout = null;

  const { 
    pattern,         // 关键字正则
    decorationTypes, // 关键字匹配样式
    assembledData,   // 格式化后的装载数据
  } = init(settings)

  // 初始化编辑器
  if (activeEditor) {
    triggerUpdateDecorations();
  }

  // 当前窗口切换编辑器
  window.onDidChangeActiveTextEditor(function (editor) {
    activeEditor = editor;
    if (activeEditor) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  // 当前工作区编辑器更新
  workspace.onDidChangeTextDocument(function (event) {
    if (activeEditor && event.document === activeEditor.document) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  const showOutProvider = new ShowOutProvider()

  // 为 view 提供 viewTree
  window.registerTreeDataProvider('todoList', showOutProvider);

  // 命令：extension.todo.showAllAnnotations
  context.subscriptions.push(vscode.commands.registerCommand('extension.todo.showAllAnnotations', 
    () => {
      if (isEmtpy(assembledData)) return;

      const availableAnnotationTypes = Object.keys(assembledData);
      chooseAnnotationType(availableAnnotationTypes).then(function (annotationType) {
        if (isEmtpy(annotationType)) return;
        searchAnnotations(workspaceState, pattern, showOutput);
      });
    }
  ));

  // 注册命令：extension.todo.refreshTodoList
  vscode.commands.registerCommand('extension.todo.refreshTodoList',
    () => showOutProvider.refresh()
  );

  // 注册命令：extension.locatateLink
  vscode.commands.registerCommand('extension.locatateLink',
    (link) => {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(link))
    }
  );

  // viewTree
  function ShowOutProvider() {
    function threeItemFomatter (annotations) {
      return annotations.map((v, i) => ({
        tooltip: v.uri + ':' + (v.lineNum + 1),
        description: v.label ,
        label: `${i + 1}`,
        command: {
          title: '',
          command: 'extension.locatateLink',
          arguments: [`${v.uri}#${v.lineNum + 1}`]
        }
        // version: '',
        // iconPath: '',
      }))
    }

    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.refresh = function() {
      this._onDidChangeTreeData.fire()
    };
    this.getTreeItem = function(element) {
      return element;
    }
    this.getChildren = function() {
      return searchAnnotations(workspaceState, pattern).then(threeItemFomatter)
    }
  }

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
        const rangeOption = mathes[v] || [];
        const decorationType = decorationTypes[v];
        if (rangeOption) {
          activeEditor.setDecorations(decorationType, rangeOption);
        }
    })
  }
  
  // 触发着色
  function triggerUpdateDecorations() {
    timeout && clearTimeout(timeout);
    timeout = setTimeout(updateDecorations, 0);
  }

  // 查询注解
  function searchAnnotations(workspaceState, pattern, callback) {
    const includePattern = getPathes(settings.get('include')) || '{**/*}';
    const excludePattern = getPathes(settings.get('exclude'));
    const limitationForSearch = settings.get('maxFilesForSearch', 5120);

    const statusMsg = ` Searching...`;

    window.processing = true;

    setStatusMsg(zapIcon, statusMsg);

    return workspace.findFiles(includePattern, excludePattern, limitationForSearch).then(function (files) {

        if (!files || files.length === 0) {
            setStatusMsg(defaultIcon, defaultMsg);
            logger('No files found', 'warn')
            return [];
        }

        const totalFiles = files.length;
              
        let times = 0,
            progress = 0,
            annotations = {},
            annotationList = [];

        function file_iterated() {
            times++;
            progress = Math.floor(times / totalFiles * 100);

            setStatusMsg(zapIcon, progress + '% ' + statusMsg);
        }

        function iterated_final () {
          if (times === totalFiles || window.manullyCancel) {
            window.processing = true;
            annotationList = annotationList.concat(
              Object.values(annotations).reduce((acc, fileAnnotations) => acc.concat(fileAnnotations), [])
              )
              workspaceState.update('annotationList', annotationList);
              setStatusMsg(defaultIcon, annotationList.length, annotationList.length + ' result(s) found');
              if (callback) {
                return callback(annotationList)
              }
              return annotationList
          }
        }

        return new Promise((resolve) => {
          for (let i = 0; i < totalFiles; i++) {
              workspace.openTextDocument(files[i]).then(function (file) {
                  const fileAnnotations = searchAnnotationInFile(file, pattern);
                  annotations = { ...fileAnnotations, ...annotations }
  
                  file_iterated();
                  iterated_final();
                  
                  if (times === totalFiles || window.manullyCancel) {
                    resolve(annotationList)
                  } 
              }, function (err) {
                  errorHandler(err);
  
                  file_iterated();
                  iterated_final();
              });
          }
        })

    }, function (err) {
        errorHandler(err);
        return []
    });
  }

  // 输出注解
  function showOutput(data) {
    if (!window.outputChannel) return;
    window.outputChannel.clear();

    if (data.length === 0) {
        window.showInformationMessage('No results');
        return;
    }

    data.forEach(function (v, i, a) {
        // due to an issue of vscode(https://github.com/Microsoft/vscode/issues/586), in order to make file path clickable within the output channel,the file path differs from platform
        var patternA = '#' + (i + 1) + '\t' + v.uri + ':' + (v.lineNum + 1);
        var patternB = '#' + (i + 1) + '\t' + v.uri + ':' + (v.lineNum + 1) + ':' + (v.startCol + 1);
        var patterns = [patternA, patternB];

        //for windows and mac
        var patternType = 0;
        if (os.platform() == "linux") {
            // for linux
            patternType = 1;
        }

        window.outputChannel.appendLine(patterns[patternType]);
        window.outputChannel.appendLine('\t' + v.label + '\n');
    });
    window.outputChannel.show();
  }

  // 文件中查询注解，并装填 annotations 和 annotationList
  function searchAnnotationInFile(file, regexp) {
    const annotations = {}
    const fileInUri = file.uri.toString();
    const pathWithoutFile = fileInUri.substring(7, fileInUri.length);

    for (let line = 0; line < file.lineCount; line++) {
        const lineText = file.lineAt(line).text;
        const match = lineText.match(regexp);
        if (match !== null) {
            if (!annotations.hasOwnProperty(pathWithoutFile)) {
                annotations[pathWithoutFile] = [];
            }
            let content = getContent(lineText, match);
            if (content.length > 500) {
                content = content.substring(0, 500).trim() + '...';
            }
            const locationInfo = getLocationInfo(fileInUri, pathWithoutFile, lineText, line, match);

            const annotation = {
                uri: locationInfo.uri,
                label: content,
                detail: locationInfo.relativePath,
                lineNum: line,
                fileName: locationInfo.absPath,
                startCol: locationInfo.startCol,
                endCol: locationInfo.endCol
            };
            annotations[pathWithoutFile].push(annotation);
        }
    }

    return annotations
  }

  // 创建 statusBar
  function createStatusBarItem() {
    const statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = defaultIcon + defaultMsg;
    statusBarItem.tooltip = 'List annotations';
    statusBarItem.command = 'extension.todo.showAllAnnotations';
    return statusBarItem;
  };

  // 更新 statusBar
  function setStatusMsg(icon, msg, tooltip) {
    if (window.statusBarItem) {
        window.statusBarItem.text = `${icon} ${msg}` || '';
        if (tooltip) {
            window.statusBarItem.tooltip = tooltip;
        }
        window.statusBarItem.show();
    }
  }

  function errorHandler(err) {
    window.processing = true;
    setStatusMsg(defaultIcon, defaultMsg);
    logger(err, 'error')
  }

  // 初始化
  function init(settings) {
    const _decorationTypes = {} // 着色映射
    const DEFAULT_KEYWORDS = {
      "TODO:": {
          text: "TODO:",
          color: '#fff',
          backgroundColor: '#40a9ff',
          overviewRulerColor: 'rgba(64,169,255,0.8)'
      }
    };

    try{
      if (!window.statusBarItem) {
        window.statusBarItem = createStatusBarItem();
      }

      if (!window.outputChannel) {
        window.outputChannel = window.createOutputChannel('TodoHighlight');
    }
    } catch (e) {
      logger(e, 'error')
    }

    const keywords = Object.keys(DEFAULT_KEYWORDS);
    const patternString = keywords.map(kw => {
      // 生成映射
      _decorationTypes[kw] = window.createTextEditorDecorationType({
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        ...DEFAULT_KEYWORDS[kw],
      });
      return escapeRegExp(kw)
    }).join('|')

    const _pattern = new RegExp(patternString, 'gi');

    if (!isEmtpy(patternString) && isEmtpy(_pattern)) {
      logger(`String '${patternString}' create Regex pattern failed!`, 'error')
      console.log(_pattern)
    }

    return {
      pattern: _pattern,
      decorationTypes: _decorationTypes,
      assembledData: DEFAULT_KEYWORDS,
    }
  }
}


function getLocationInfo(fileInUri, pathWithoutFile, lineText, line, match) {
  var rootPath = workspace.rootPath + '/';
  var outputFile = pathWithoutFile.replace(rootPath, '');
  var startCol = lineText.indexOf(match[0]);
  var endCol = lineText.length;
  var location = outputFile + ' ' + (line + 1) + ':' + (startCol + 1);

  return {
      uri: fileInUri,
      absPath: pathWithoutFile,
      relativePath: location,
      startCol: startCol,
      endCol: endCol
  };
};

function getContent(lineText, match) {
  return lineText.substring(lineText.indexOf(match[0]), lineText.length);
};

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

function logger(msg, type = 'info') {
  switch (type) {
    case 'info':
      console.log(msg);
      break;
    case 'warn':
      console.warn(msg);
      break;
    case 'error':
      console.error(msg);
      break;
    default:
      console.log(msg);
      break;
  }
}

function error(msg) {
  throw new Error(msg);
}