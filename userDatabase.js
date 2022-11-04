const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const SHEET_NAME = 'table'
const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
const sheet = spreadsheet.getSheetByName(SHEET_NAME);
function insertUser(userId, unixTimestamp){
  const dateTime = getDateTime(unixTimestamp);
  const newRowNum = sheet.getLastRow() + 1;
  sheet.getRange(newRowNum, 1, 1, 2).setValues([[userId, dateTime]]);
}
function deleteUser(userId){
  const rowCount = sheet.getLastRow();
  for(let rowNum = 2; rowNum < rowCount + 1; ++rowNum){
    if(sheet.getRange(rowNum, 1).getValue() === userId){
      sheet.deleteRow(rowNum);
      break;
    }
  }
}
function getAllUserIds(){
  let allUserIds = [];
  const rowCount = sheet.getLastRow();
  for(let rowNum = 2; rowNum < rowCount + 1; ++rowNum){
    allUserIds.push(sheet.getRange(rowNum, 1).getValue());
  }
  return allUserIds;
}
function getDateTime(unixTimestamp){
  const timestamp = new Date(unixTimestamp);
  const dateTime = timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString();
  return dateTime;
}