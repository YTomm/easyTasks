const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN');
const TASK_DATABASE_ID = PropertiesService.getScriptProperties().getProperty('TASK_DATABASE_ID');
const USER_DATABASE_ID = PropertiesService.getScriptProperties().getProperty('USER_DATABASE_ID');
const PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const EMPTY_TASK = 'タスクはありません。';
const TEXT_USERTABLE = 'table';
const TEXT_MESSAGE_EVENT = 'message';
const TEXT_UNSEND_EVENT = 'unsend';
const TEXT_FOLLOW_EVENT = 'follow';
const TEXT_UNFOLLOW_EVENT = 'unfollow';
const TEXT_TEXT = 'text';
const TEXT_IMAGE = 'image';
const TEXT_VIDEO = 'video';
const TEXT_AUDIO = 'audio';
const TEXT_FILE = 'file';
const TEXT_LOCATION = 'location';
const TEXT_STICKER = 'sticker';
const TEXT_ALL = 'all';
const TEXT_DEL = 'del';
const TEXT_SWAP = 'swap';
const TEXT_MERGE = 'merge';
const TEXT_PUSH = 'push';
const TEXT_TRUE = 'true';
const TEXT_FALSE = 'false';
const TEXT_EXPLANATION = 'お友達追加ありがとうございます！\nメッセージを送信するとタスクとして登録されます。タスクが終わったり間違ったりして消したいときは、もう一度同じ言葉を入れるか、もしくは「del {番号}」と送信してください！番号は空白区切りでいくつでも入力できます。\n「del 0」で全部のタスクが削除されます。復元はできないので注意してください。\nタスクの番号を入れ替えることも可能です。「swap {番号} {番号}」と swap の後に 2 つの番号をスペース区切りで入力してください。\n「merge {番号} {番号}……」で複数のタスクを入力した番号順に一つにまとめることができます。';
const DEL_FAILED = 'delete に失敗しました。番号を確認してください。';
const SWAP_FAILED = 'swap に失敗しました。番号を確認してください。';
const MERGE_FAILED = 'merge に失敗しました。番号を確認してください。';
function doPost(e) {
  const events = JSON.parse(e.postData.contents).events;
  events.forEach(
    function(event){
      if(event.type === TEXT_MESSAGE_EVENT){
        message(event);
      } else if(event.type === TEXT_FOLLOW_EVENT){
        follow(event);
      } else if(event.type === TEXT_UNFOLLOW_EVENT){
        unfollow(event);
      }
    }
  );
}
function sendPushMessage(userId, text){
  const payload = {
    'to': userId,
    'messages': [
      {
        'type': 'text',
        'text': text
      }
    ]
  };
  const options = {
    'payload' : JSON.stringify(payload),
    'method'  : 'POST',
    'headers' : {"Authorization" : "Bearer " + CHANNEL_ACCESS_TOKEN},
    'contentType' : 'application/json'
  };
  UrlFetchApp.fetch(PUSH_URL, options);
}
function sendReplyMessage(replyToken, text){
  const payload = {
    'replyToken': replyToken,
    'messages': [
      {
        'type': 'text',
        'text': text
      }
    ]
  };
  const options = {
    'payload' : JSON.stringify(payload),
    'method'  : 'POST',
    'headers' : {"Authorization" : "Bearer " + CHANNEL_ACCESS_TOKEN},
    'contentType' : 'application/json'
  };
  UrlFetchApp.fetch(REPLY_URL, options);
}
function message(event){
  const replyToken = event.replyToken;
  const evemtMode = event.mode;
  const unixTimestamp = event.timestamp;
  const source = event.source;
  const userId = source.userId;
  const message = event.message;
  const messageType = message.type;
  const messageText = message.text;
  console.log(messageText);
  const taskDatabaseSheet = SpreadsheetApp.openById(TASK_DATABASE_ID).getSheetByName(userId);
  if(taskDatabaseSheet === null) console.log('not in user list');
  obtainSheet(taskDatabaseSheet);
  if(messageType === TEXT_TEXT){
    const headThree = messageText.substring(0, 3);
    const headFour = messageText.substring(0, 4);
    const headFive = messageText.substring(0, 5);
    if(messageText === TEXT_ALL){
      console.log('ok all');
    } else if(headThree === TEXT_DEL){
      const res = taskDatabase.deleteTasksUser(userId, messageText.substring(4));
      if(res === false){
        sendReplyMessage(replyToken, DEL_FAILED);
        releaseSheet(taskDatabaseSheet);
        return;
      }
      console.log('ok del');
    } else if(headFour === TEXT_SWAP){
      const res = taskDatabase.swapTasksUser(userId, messageText.substring(5));
      if(res === false){
        sendReplyMessage(replyToken, SWAP_FAILED);
        releaseSheet(taskDatabaseSheet);
        return;
      }
      console.log('ok swap');
    }else if(headFive === TEXT_MERGE){
      const re = taskDatabase.mergeTasksUser(userId, messageText.substring(6), unixTimestamp);
      if(res === false){
        sendReplyMessage(replyToken, MERGE_FAILED);
        releaseSheet(taskDatabaseSheet);
        return;
      }
      console.log('ok merge');
    }else{
      const taskIndex = taskDatabase.checkTask(userId, messageText);
      if(taskIndex === null){
        taskDatabase.insertTaskUser(userId, messageText, unixTimestamp);
        console.log('ok insert');
      }else{
        taskDatabase.deleteTaskUser(userId, taskIndex);
        console.log('ok del');
      }
    }
    sendAllTaskReplyMessage(replyToken, userId);
  }
  releaseSheet(taskDatabaseSheet);
}
function follow(event){
  const replyToken = event.replyToken;
  const unixTimestamp = event.timestamp;
  const source = event.source;
  const userId = source.userId;
  const userDatabaseSheet = SpreadsheetApp.openById(USER_DATABASE_ID).getSheetByName(TEXT_USERTABLE);
  obtainSheet(userDatabaseSheet);
  sendReplyMessage(replyToken, TEXT_EXPLANATION);
  userDatabase.insertUser(userId, unixTimestamp);
  taskDatabase.initSheet(userId);
  const taskDatabaseSheet = SpreadsheetApp.openById(TASK_DATABASE_ID).getSheetByName(userId);
  obtainSheet(taskDatabaseSheet);
  releaseSheet(taskDatabaseSheet);
  releaseSheet(userDatabaseSheet);
}
function unfollow(event){
  const source = event.source;
  const userId = source.userId;
  const userDatabaseSheet = SpreadsheetApp.openById(USER_DATABASE_ID).getSheetByName(TEXT_USERTABLE);
  const taskDatabaseSheet = SpreadsheetApp.openById(TASK_DATABASE_ID).getSheetByName(userId);
  obtainSheet(userDatabaseSheet);
  obtainSheet(taskDatabaseSheet);
  userDatabase.deleteUser(userId);
  taskDatabase.deleteSheetUser(userId);
  releaseSheet(userDatabaseSheet);
}
function sendDailyMessage(){
  const allIds = getAllIds();
  allIds.forEach(
    function(userId){
      sendAllTaskPushMessage(userId);
    }
  );
}
function sendAllTaskPushMessage(userId){
  const allTasksUserString = taskDatabase.getAllTasksUserString(userId);
  if(allTasksUserString === ''){
    sendPushMessage(userId, EMPTY_TASK);
  }else{
    sendPushMessage(userId, allTasksUserString);
  }
}
function sendAllTaskReplyMessage(replyToken, userId){
  const allTasksUserString = taskDatabase.getAllTasksUserString(userId);
  if(allTasksUserString === ''){
    sendReplyMessage(replyToken, EMPTY_TASK);
  }else{
    sendReplyMessage(replyToken, allTasksUserString);
  }
}
function obtainSheet(sheet){
  waitForFreeSheet(sheet);
  sheet.getRange(1, 4).setValue(TEXT_TRUE);
}
function releaseSheet(sheet){
  sheet.getRange(1, 4).setValue(TEXT_FALSE);
}
function waitForFreeSheet(sheet){
  while(sheet.getRange(1, 4).getValue() === TEXT_TRUE){
    Utilities.sleep(10); 
  }
}