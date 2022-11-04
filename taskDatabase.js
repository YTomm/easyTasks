const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const TEXT_USERID = 'UserId';
const TEXT_TASK = 'Task';
const TEXT_DATETIME = 'DateTime';
const TEXT_IN_USE = 'InUse';
const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
function initSheet(userId){
  let sheet = spreadsheet.getSheetByName(userId); //let でよい
  if(sheet === null){
    spreadsheet.insertSheet(userId);
    sheet = spreadsheet.getSheetByName(userId);
    sheet.getRange(1, 1).setValue(userId);
    sheet.getRange(1, 3).setValue(getDateTime(new Date().getTime()));
    sheet.autoResizeColumn(1);
    sheet.autoResizeColumn(3);
  }
  const rowCount = sheet.getLastRow();
  const dataRange = sheet.getRange(1, 1, rowCount, 3);
  dataRange.clearContent();
  sheet.getRange(1, 1, 1, 4).setValues([[TEXT_USERID, TEXT_TASK, TEXT_DATETIME, TEXT_IN_USE]]);
}
function deleteSheetUser(userId){
  const sheet = spreadsheet.getSheetByName(userId);
  spreadsheet.deleteSheet(sheet);
}
function insertTaskUser(userId, task, unixTimestamp){
  const sheet = spreadsheet.getSheetByName(userId);
  const dateTime = getDateTime(unixTimestamp);
  const insertIndex = sheet.getLastRow() + 1;
  const targetCell = sheet.getRange(insertIndex, 2);
  targetCell.setNumberFormat('@');
  sheet.getRange(insertIndex, 1, 1, 3).setValues([[userId, task.toString(), dateTime]]);
}
function deleteTaskUser(userId, taskIndex){
  const sheet = spreadsheet.getSheetByName(userId);
  sheet.deleteRow(taskIndex + 1);
}
function checkTask(userId, task){
  const sheet = spreadsheet.getSheetByName(userId);
  const rowCount = sheet.getLastRow();
  for(let taskIndex = 1; taskIndex < rowCount; ++taskIndex){
    if(sheet.getRange(taskIndex + 1, 2).getValue() === task){
      return taskIndex;
    }
  }
  return null;
}
function getAllTasksUserString(userId){
  const sheet = spreadsheet.getSheetByName(userId);
  const rowCount = sheet.getLastRow();
  const allTasksUser = [];
  for(let rowNum = 2; rowNum < rowCount + 1; ++rowNum){
    allTasksUser.push((rowNum - 1).toString() + '. ' + sheet.getRange(rowNum, 2).getValue());
  }
  return allTasksUser.join('\n');
}
function getAllTasksUserMap(userId){
  const sheet = spreadsheet.getSheetByName(userId);
  const rowCount = sheet.getLastRow();
  const allTasksUserMap = new Map();
  for(let rowNum = 2; rowNum < rowCount + 1; ++rowNum){
    allTasksUserMap.set(rowNum - 1, sheet.getRange(rowNum, 2).getValue());
  }
  return allTasksUserMap;
}
function deleteTasksUser(userId, tasks){
  const sheet = spreadsheet.getSheetByName(userId);
  const rowCount = sheet.getLastRow();
  const taskIndicesSet = parseSetTasks(tasks, rowCount - 1);
  const taskIndicesArray = Array.from(taskIndicesSet);
  taskIndicesArray.sort((first, second) => second - first);
  if(taskIndicesArray.length === 0){
    return false;
  }
  const minTaskIndex = taskIndicesArray.pop();
  if(minTaskIndex === 0){
    initSheet(userId);
    return;
  }
  taskIndicesArray.push(minTaskIndex);
  for(const taskIndex of taskIndicesArray){
    deleteTaskUser(userId, taskIndex);
  }
  return true;
}
function swapTasksUser(userId, tasks){
  const sheet = spreadsheet.getSheetByName(userId);
  const rowCount = sheet.getLastRow();
  const taskIndicesSet = parseSetTasks(tasks, rowCount - 1);
  const taskIndicesArray = Array.from(taskIndicesSet);
  const indexA = taskIndicesArray[0], indexB = taskIndicesArray[1];
  if(taskIndicesSet.size !== 2 || indexA === 0 || indexB === 0){
    return false;
  }
  const valueA = sheet.getRange(indexA + 1, 2, 1, 2).getValues(), valueB = sheet.getRange(indexB + 1, 2, 1, 2).getValues();
  sheet.getRange(indexA + 1, 2, 1, 2).setValues(valueB);
  sheet.getRange(indexB + 1, 2, 1, 2).setValues(valueA);
  return true;
}
function mergeTasksUser(userId, tasks, unixTimestamp){
  const sheet = spreadsheet.getSheetByName(userId);
  const rowCount = sheet.getLastRow();
  const taskIndicesSet = parseSetTasks(tasks, rowCount - 1);
  const taskIndicesArray = Array.from(taskIndicesSet);
  taskIndicesArray.sort((first, second) => second - first);
  if(taskIndicesArray.length === 0){
    return false;
  }
  const minTaskIndex = taskIndicesArray.pop();
  if(minTaskIndex !== 0){
    taskIndicesArray.push(minTaskIndex);
  }
  const mergerdTasks = []
  for(const taskIndex of taskIndicesSet){
    if(taskIndex === 0)continue;
    mergerdTasks.push(sheet.getRange(taskIndex + 1, 2).getValue());
  }
  for(const taskIndex of taskIndicesArray){
    deleteTaskUser(userId, taskIndex);
  }
  insertTaskUser(userId, mergerdTasks.join(' '), unixTimestamp);
  return true;
}
function parseSetTasks(tasks, tasksCount){
  const taskIndicesSet = new Set();
  const taskStrings = tasks.split(' ');
  taskStrings.forEach(
    function(taskString){
      parseIntTask = parseInt(taskString, 10);
      if(taskString === parseIntTask.toString()){
        if(0 <= parseIntTask && parseIntTask <= tasksCount){
          taskIndicesSet.add(parseIntTask);
        }
      }
    }
  );
  return taskIndicesSet;
}
function getDateTime(unixTimestamp){
  const timestamp = new Date(unixTimestamp);
  const dateTime = timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString();
  return dateTime;
}