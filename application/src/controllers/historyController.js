const db = require("../configs/database.js");
const localPath = 'http://localhost:4000/history';
const path = 'http://emotionthermometer.online/history';
const emojiController = require("../controllers/emojiController");

async function checkIfUserIsInstructor(req, res, next) {
  let classLinkId

  if (req.params.classLinkId){
    classLinkId = req.params.classLinkId;
  }else if (req.query.classLinkId) {
    classLinkId = req.query.classLinkId;
  }else if (req.headers.referer){
    let numbersInUrl = emojiController.getIdsFromUrl(req.headers.referer);
    if (numbersInUrl.length >= 3 ){
      classId = numbersInUrl[2];
      classLinkId = numbersInUrl[1];
    }
  }

  let query;
  if (req.user && req.body.classId){
    query =
        " SELECT * FROM emojidatabase.registrations where classes_id = " + req.body.classId + " and users_id = " + req.user;
  }else{
    query =
        " SELECT * FROM emojidatabase.registrations where id = " + classLinkId;
  }

  try {
    const [res, err] = await db.execute(query);
    // console.log(query);
    req.isInstructor = res[0].isInstructor;
    req.class_id = res[0].classes_id;
    req.classLinkId = classLinkId;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
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
    got through each day
    grab the date and create a new dictionary
    key is the x/xx/xxxx and value is the record
    if there is more than 1 per minute, add up the the mojis
     */
    let newRecords = {};
    let isMinFound;
    req.records.forEach( record => {
      //get the date
      let dateTimeMilliseconds = Date.parse(record.date_time);
      let dateTime = new Date(dateTimeMilliseconds);
      let keyLocaleDateString = dateTime.toLocaleDateString();

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
            for (let j = 1; j <= 5; j++){
              newRecords[keyLocaleDateString][i][`count_emoji${j}`] += record[`count_emoji${j}`];
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


function getEmptyRecords(){
  let records = {
    count_emoji1: 0,
    count_emoji2: 0,
    count_emoji3: 0,
    count_emoji4: 0,
    count_emoji5: 0,
    count_notParticipated:0
  }
  return records;
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
      // let records = getEmptyRecords();
      regIdArr = [];
      // records[`count_emoji${emojiSuffix}`] = 1;
      //TODO find better way to display count for not participate , if we have multiple people participating
      /*
      get count not participate
       */
      // records[`count_notParticipated`] = req.records ;
      // emojiRecord.records = records;
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
            // newEmojiRecordsPerDay[keyLocaleDateString][subArrLength - 1].records[`count_emoji${emojiSuffix}`] += 1;
            if (!regIdArr.includes(currentRegId)){
              regIdArr.push(currentRegId)
            }
            // newEmojiRecordsPerDay[keyLocaleDateString][subArrLength - 1].records[`count_notParticipated`] =
            //     req.classRegisteredStudentsCount - regIdArr.length;
          }else {// if the minute is different , but in the same day
            // let records = getEmptyRecords();
            regIdArr = [];
            // records[`count_emoji${emojiSuffix}`] = 1;
            // records[`count_notParticipated`] = studentRegistered - 1;
            // emojiRecord.records = records;
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
  let emojiDatesArray = Object.keys(req.emojiRecordsPerDay);

  if (req.isInstructor === 1) {
    tmp = true;
  }
  let topChartKey;
  if (req.params.date) {
    let paramsDate = req.params.date;
    let paramsDateArr = paramsDate.split('-');
    topChartKey = paramsDateArr.join('/');
  } else {
    topChartKey = emojiDatesArray[emojiDatesArray.length - 1];
  }
  //get current date and compare with the latest
  let current = new Date();
  current = current.toLocaleDateString('en-US',{ timeZone: 'America/Los_Angeles'})
  let topChartRecords;
  let topChart;
  let topDate;
  if (current === topChartKey) {
    //if current date equal to top Chart key this means we have data  for that day
    topChart = req.emojiRecordsPerDay[topChartKey];
    topChartRecords = req.newRecords[topChartKey];
    topDate = (new Date(Date.parse(topChart[parseInt(0)].date_time))).toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'});
  } else {
    //if current date not equal to top Chart key this means no data yet for that day
    topDate = current;
    topChartRecords = '';
    topChart = '';
  }


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
    userInfo: req.userInfo,
    history_chart_access: req.history_chart_access,
    history_text_access: req.history_text_access,
    classLinkId: req.classLinkId,
    classId: req.class_id,
    classInfo : req.classInfo
  });
}


module.exports = {
  checkIfUserIsInstructor:checkIfUserIsInstructor,
  getClassID:getClassID,
  getEmojiRecordsPerMinute:getEmojiRecordsPerMinute,
  getText:getText,
  getUserVisibility:getUserVisibility,
  updateUserVisibility:updateUserVisibility,
  getHistoryPage:getHistoryPage,
  getPostedEmojiRecords:getPostedEmojiRecords
}
