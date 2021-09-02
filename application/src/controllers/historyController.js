const db = require("../configs/database.js");
const localPath = 'http://localhost:4000/history';
const path = 'http://emotionthermometer.online/history';
const emojiController = require("../controllers/emojiController");
const DateService = require( "../services/dateServices" );
const dateService = new DateService();


function historySocket() {
  // global.io.on('connection',(socket)=> {
  //   console.log("Connection from history controller");
    global.io.on('user online', socket => {
      console.log("User online array in history controller" , socket);
      return socket;
    })
  // })
}

async function checkIfUserIsInstructor(req, res, next) {
  let classLinkId;
  let classId;
  if (req.params.classLinkId && req.params.classId){
    classLinkId = req.params.classLinkId;
    classId = req.params.classId;
  }else if (req.query.classLinkId) {
    const re = /\d+/g;
    if (req.query.classLinkId.match(re)){
      let numbersInUrl = emojiController.getIdsFromUrl(req.query.classLinkId);
      if (numbersInUrl.length === 2){
        classLinkId = numbersInUrl[0];
        classId = numbersInUrl[1];
      }
    }
  }else if (req.headers.referer){
    let numbersInUrl = emojiController.getIdsFromUrl(req.headers.referer);
    if (numbersInUrl.length >= 3 ){
      classId = numbersInUrl[2];
      classLinkId = numbersInUrl[1];
    }
  }

  let query;
  req.user = req.body.userid ? req.body.userid : req.session.passport.user.user[0].id
  if (req.user && req.body.classId){
    query =
        " SELECT * FROM emojidatabase.registrations where classes_id = " + req.body.classId + " and users_id = " + req.user;
  }else if (req.query && Object.keys(req.query).length > 0 && req.user && req.user.body){
    req.user = req.query.userId;
    query =
        " SELECT * FROM emojidatabase.registrations where users_id = " + req.user + " and classes_id = " + req.body.classId;
  }else if (!req.user && classId){
    if (req.query){
      req.user = req.query.userId;
    }
    query =
        " SELECT * FROM emojidatabase.registrations where users_id = " + req.user + " and classes_id = " + classId;

  }else if (req.user && req.user.user){
       req.user = req.user.user[0].id;
       req.classId = req.user.body.classId;
       req.classLinkId = req.user.body.classLinkId;
    query =
        " SELECT * FROM emojidatabase.registrations where users_id = " + req.user + " and classes_id = " + req.classId;

  } else if (req.user && classId) {
    query =
        " SELECT * FROM emojidatabase.registrations where users_id = " + req.user + " and classes_id = " + classId;
  }
    try {
      const [res, err] = await db.execute(query);
      // console.log(query);
      req.isInstructor = res[0].isInstructor;
      req.class_id = res[0].classes_id;
      req.classLinkId = classLinkId ? classLinkId : '';
      next();
    } catch (e) {
        console.log("Catch an error: ", e);
        res.redirect.back();
    }

}

async function getClassID(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.registrations where id = " + req.query.classLinkId;

  try {
    const [res, err] = await db.execute(query);
    // console.log(query);
    req.class_id = res[0].classes_id;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getPostedEmojiRecords(req, res, next) {
  let query =
      " SELECT * FROM emojidatabase.posted_emojis where class_id = " +
      req.class_id;
  await emojiController.getClassRegisteredStudentsCount(req, res, next);
  await getEmojiRecordsPerMinute(req,res,next);

  try {
    const [res, err] = await db.execute(query);

    temp = processEmojiRecordsPerDay(res, req);
    req.emojiRecordsPerDay = temp; // where we get the records
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getEmojiRecordsPerMinute(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.emojiRecordsPerMinute where classes_id = " +
    req.class_id;
  try {
    const [res, err] = await db.execute(query);
    // req.records = convertTime(res);
    req.records = res;
    /*
    go through each day
    grab the date and create a new dictionary
    key is the x/xx/xxxx and value is the record
    if there is more than 1 per minute, add up the the mojis
     */
    let newRecords = {};
    let isMinFound;
    req.records.forEach( record => {
      //get the date in local string from db record
      let keyLocaleDateString = dateService.parseDateTimeRecord(record.date_time);
      // if newRecords does not have key , add key and value
      if (!newRecords.hasOwnProperty(keyLocaleDateString)){
        newRecords[keyLocaleDateString] = [];
        newRecords[keyLocaleDateString].push(record);
      }else{//if newRecords has key
        isMinFound = false;
        for (let i =0; i < newRecords[keyLocaleDateString].length; i++){
          let existingValue = newRecords[keyLocaleDateString][i];
          //if object has the same min, add up the counts only
          if (existingValue.min === record.min){
            isMinFound = true;
            // if min is the same but the user is the same , use the record count to replace the existing one
            if (newRecords[keyLocaleDateString][i]['users_id'] === record['users_id']) {
              for (let j = 1; j <= 5; j++){
                if (newRecords[keyLocaleDateString][i][`count_emoji${j}`] !== record[`count_emoji${j}`]){
                  newRecords[keyLocaleDateString][i][`count_emoji${j}`] = record[`count_emoji${j}`];
                }
              }
              // if min is the same but the user is not the same, then add it
            }else {
              let sumCountEmoji = 0 ;
              for (let j = 1; j <= 5; j++){
                newRecords[keyLocaleDateString][i][`count_emoji${j}`] += record[`count_emoji${j}`];
                sumCountEmoji += newRecords[keyLocaleDateString][i][`count_emoji${j}`];
              }


            }
            //done adding to existing record, we don't add record to newRecords
            break;
          }
        }
        //has key but min is not the same add value to that key
        if (isMinFound === false){
          newRecords[keyLocaleDateString].push(record)
        }
      }//end if else
    });

    req.newRecords = newRecords;

  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

function processEmojiRecordsPerDay (emojiRecordsPerDay, req) {
  var newEmojiRecordsPerDay = {};
  var studentRegistered = req.classRegisteredStudentsCount;
  for (let i =0 ; i < emojiRecordsPerDay.length ; i++ ) {

    let emojiRecord = emojiRecordsPerDay[i];
    let dateTimeMilliseconds = Date.parse(emojiRecord.date_time);
    let dateTime = new Date(dateTimeMilliseconds);
    let keyLocaleDateString = dateTime.toLocaleDateString();
    let dateInt = dateTime.getDate();
    let monthInt = dateTime.getMonth();
    let hoursInt = dateTime.getHours();
    let minuteInt = dateTime.getMinutes();
    let emojiSuffix = emojiRecord.emojis_id;
    let currentRegId = emojiRecord.registration_id;

    if (!newEmojiRecordsPerDay.hasOwnProperty(keyLocaleDateString)) {
      //key does not exist
      //init first key value array
      newEmojiRecordsPerDay[keyLocaleDateString] = [];
      regIdArr = [];
            newEmojiRecordsPerDay[keyLocaleDateString].push(emojiRecord);
      regIdArr.push(emojiRecord.registration_id);

    } else { //object has key , add values into array
      let subArrLength = newEmojiRecordsPerDay[keyLocaleDateString].length;
      let prevDateTimeMilliseconds = Date.parse(newEmojiRecordsPerDay[keyLocaleDateString][subArrLength - 1].date_time);
      let prevDateTime = new Date(prevDateTimeMilliseconds);
      //while date and month is the same
      if (prevDateTime.getDate() === dateInt && prevDateTime.getMonth() === monthInt) {
          if (prevDateTime.getHours() === hoursInt && prevDateTime.getMinutes() === minuteInt){
            //records
            if (!regIdArr.includes(currentRegId)){
              regIdArr.push(currentRegId)
            }

          }else {// if the minute is different , but in the same day
            regIdArr = [];
            newEmojiRecordsPerDay[keyLocaleDateString].push(emojiRecord);
            regIdArr.push(emojiRecord.registration_id)

          }
      } else {
        //while date and month is not the same create new array with the record
        newEmojiRecordsPerDay[keyLocaleDateString].push([emojiRecord]);
      }
    }
  }
  return newEmojiRecordsPerDay;
}

function convertTime (emojiRecordsArray) {

  emojiRecordsArray.forEach( emojiRecord => {
        let convertedMinutes = convertMinHourHelper(emojiRecord.min)
        emojiRecord.date_time = convertedMinutes;
      });
  return emojiRecordsArray;
}

function convertMinHourHelper(unformattedMinutes) {
  let decimalResult = parseFloat(unformattedMinutes/60); // divide to get hours
  let hours = Math.floor(decimalResult);
  let remainder = parseFloat(decimalResult - hours);
  let minute = parseInt(remainder  * 60);
  if (minute < 10){
    minute = "0" + minute;
  }
  if (hours < 10){
    hours = "0" + hours;
  }
  return `${hours}:${minute}`;
}



async function getText(req, res, next) {
  let query =
    `  SELECT P.date_time, P.emojis_id, P.text, U.id, U.full_name, P.isAnonymous, 
 SUBSTRING(date_time, 16,6) as record_time
    FROM emojidatabase.posted_emojis P
    join emojidatabase.users U on U.id = P.users_id where length(text)>0 and class_id =` +
    req.class_id;

  try {
    const [rows, fields] = await db.execute(query);
    // console.log(query);
    req.userInfo = rows;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function updateUserVisibility(req, res, next) {
  var historChartAccess = req.history_chart_access;
  if (req.body.history_chart_access !== undefined) {
    historChartAccess = req.body.history_chart_access;
  }
  var historTextAccess = req.history_text_access;
  if (req.body.history_text_access !== undefined) {
    historTextAccess = req.body.history_text_access;
  }
  let query =
    " UPDATE emojidatabase.classes set history_chart_access = " +
    historChartAccess +
    ", history_text_access = " +
    historTextAccess +
    " where id =" +
    req.class_id;
  try {
    await db.execute(query);
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getUserVisibility(req, res, next) {
  let query = " select * from emojidatabase.classes where id =" + req.class_id;

  try {
    const [res, err] = await db.execute(query);
    req.history_chart_access = res[0].history_chart_access;
    req.history_text_access = res[0].history_text_access;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getHistoryPage(req,res) {
  let tmp = false;
  let isParamsDateActive = false;
  let emojiDatesArray = Object.keys(req.emojiRecordsPerDay);

  if (req.isInstructor === 1) {
    tmp = true;
  }
  let topChartKey;
  // if a date is passed in through url
  if (req.params.date) {
    //use the params date
    isParamsDateActive = true;
    let paramsDate = req.params.date;
    let paramsDateArr = paramsDate.split('-');
    topChartKey = paramsDateArr.join('/');
  } else {
    // else take the latest
    topChartKey = emojiDatesArray[emojiDatesArray.length - 1];
  }
  //get current date and compare with the topChartKey
  let current = new Date();
  current = current.toLocaleDateString('en-US',{ timeZone: 'America/Los_Angeles'})
  let topChartRecords;
  let topChart;
  let topDate;

  if (!isParamsDateActive){ // if no date in params
    if (current === topChartKey) {
      //if current date equal to top Chart key this means we have data for that day
      topChart = req.emojiRecordsPerDay[topChartKey];
      topChartRecords = req.newRecords[topChartKey];
      topDate = (new Date(Date.parse(topChart[parseInt(0)].date_time))).toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'});
    }else {
      //if current date not equal to top Chart key this means no data yet for that day
      topDate = current;
      topChartRecords = '';
      topChart = '';
    }
  }else { // if isParamsDateActive is true , i.e. there is date in params
      //if current date equal to top Chart key this means we have data  for that day
      topChart = req.emojiRecordsPerDay[topChartKey];
      topChartRecords = req.newRecords[topChartKey];
      topDate = topChartKey;
  }


  // Todo grab from req.userinfo the date time that match top chart
  req.userInfoList =[];
  if (topChartRecords){
    if (topChartRecords.length !== 0){
      req.userInfoList = dateService.findMatchingObjectsList(req.userInfo, topChartKey)
    }else{
      req.userInfoList = [];
    }
  }else{
    topChartRecords = '';
    topChart = '';
  }

  // get topChartKey is the date we want to show
  // for each user info, check date_time, parse it , match itto topChart key
  // if it matches take it put into anew array
  // return array empty or full

  let query = "SELECT * from emojidatabase.classes where id = " + req.class_id;
  let classInfo;
  try{
    const [rows,err] = await db.execute(query);
    req.classInfo = rows[0];
  }catch (e) {
    console.log(e)
  }

  res.render('newHistory', {
    path:path,
    emojiDatesArray: emojiDatesArray,
    topDate: topDate,
    topChart: topChart,
    topChartRecords: topChartRecords,
    isInstructor: tmp,
    postedRecordsPerDay: req.emojiRecordsPerDay,
    userInfo: req.userInfoList,
    userid: req.body.userid,
    emojiSelected: req.body.emojiSelected,
    isAnonymousStatus: req.body.isAnonymousStatus,
    history_chart_access: req.history_chart_access,
    history_text_access: req.history_text_access,
    classLinkId: req.classLinkId,
    classId: req.class_id,
    classInfo : req.classInfo
  });
}


module.exports = {
  historySocket: historySocket,
  checkIfUserIsInstructor:checkIfUserIsInstructor,
  getClassID:getClassID,
  getEmojiRecordsPerMinute:getEmojiRecordsPerMinute,
  getText:getText,
  getUserVisibility:getUserVisibility,
  updateUserVisibility:updateUserVisibility,
  getHistoryPage:getHistoryPage,
  getPostedEmojiRecords:getPostedEmojiRecords
}
