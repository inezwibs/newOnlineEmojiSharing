const db = require("../configs/database.js");
const localPath = 'http://localhost:4000/history';
const path = 'http://emotionthermometer.online/history';
const emojiController = require("../controllers/emojiController");

async function checkIfUserIsInstructor(req, res, next) {
  let tempRegId;
  if (req.params.classLinkId){
    tempRegId = req.params.classLinkId;
  }else if (req.query.classLinkId) {
    tempRegId = req.query.classLinkId;
  }else if (req.headers.referer){
    let numbersInUrl = emojiController.getIdsFromUrl(req.headers.referer);
    tempRegId = numbersInUrl[1];
  }
  let query =
    " SELECT * FROM emojidatabase.registrations where id = " + tempRegId;

  // await db.execute(query, (err, res) => {
  //     // console.log(query);
  //     if (err) throw err;
  //     req.isInstructor = res[0].isInstructor;
  //     next();
  // });
  try {
    const [res, err] = await db.execute(query);
    // console.log(query);
    req.isInstructor = res[0].isInstructor;
    req.class_id = res[0].classes_id;
    req.classLinkId = res[0].id;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getClassID(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.registrations where id = " + req.query.classLinkId;
  // await db.execute(query, (err, res) => {
  //     // console.log(query);
  //     req.class_id = res[0].classes_id;
  //     next();
  // });
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

  try {
    const [res, err] = await db.execute(query);
    // console.log(query);

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
    // console.log(query);

    req.records = convertTime(res);
    // req.records = res; // where we get the records

    next();
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
      let records = getEmptyRecords();
      regIdArr = [];
      records[`count_emoji${emojiSuffix}`] = 1;
      records[`count_notParticipated`] = studentRegistered - 1;
      emojiRecord.records = records;
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
            newEmojiRecordsPerDay[keyLocaleDateString][subArrLength - 1].records[`count_emoji${emojiSuffix}`] += 1;
            if (!regIdArr.includes(currentRegId)){
              regIdArr.push(currentRegId)
            }
            newEmojiRecordsPerDay[keyLocaleDateString][subArrLength - 1].records[`count_notParticipated`] =
                req.classRegisteredStudentsCount - regIdArr.length;
          }else {// if the minute is different , but in the same day
            let records = getEmptyRecords();
            regIdArr = [];
            records[`count_emoji${emojiSuffix}`] = 1;
            records[`count_notParticipated`] = studentRegistered - 1;
            emojiRecord.records = records;
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
    ` SELECT P.date_time, P.emojis_id, P.text, U.full_name, P.isAnonymous, SUBSTRING(date_time, 16,6) as record_time
    FROM emojidatabase.posted_emojis P
     join emojidatabase.registrations R on P.registration_id = R.id
     join emojidatabase.users U on U.id = R.users_id where length(text)>0 and class_id = ` +
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
    // console.log(query);
    req.history_chart_access = res[0].history_chart_access;
    req.history_text_access = res[0].history_text_access;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getHistoryPage(req,res) {
  let tmp = false;
  let currentMs, currentObj;
  let emojiDatesArray = Object.keys(req.emojiRecordsPerDay);

  if (req.isInstructor === 1) {
    tmp = true;
  }
  if (req.params.date){
    let paramsDate = req.params.date;
    let paramsDateArr = paramsDate.split('-');
    //new Date(year, month, day) , year is actual year, month is 0-11, day is actual day, hours defaul to 0, minutes default to 0
    // let currentDate = new Date(Date());
    // currentObj = new Date(paramsDateArr[paramsDateArr.length-1],paramsDateArr[0]-1,paramsDateArr[1],currentDate.getHours(), currentDate.getMinutes());
    // currentMs = currentObj.getTime();
    topChartKey = paramsDateArr.join('/');
  }else {
    // currentObj = new Date(Date());
    // currentMs = currentObj.getTime();
    //
    topChartKey = emojiDatesArray[emojiDatesArray.length-1];
  }

  // let dateStringKeys = Object.keys(req.emojiRecordsPerDay);
  // let dateParsedMillisecondsFirst, dateParsedMillisecondsLast,dateParsedMilliseconds;
  // let tempDiffFirst, tempDiffLast, tempDiff;
  //parse each of the keys and find the closest/smallest difference
  // let keyOrder = new Map();
  // let minValue = Math.abs(currentMs-Date.parse(dateStringKeys[0]));
  // let topChartKey;
  /*
   {
    a : [b,c,e],
    c : [d]
  }
  minValue = 0;
   */

  // dateStringKeys.forEach( key => {
  //   dateParsedMilliseconds = Date.parse(key);
  //   tempDiff = Math.abs(currentMs-dateParsedMilliseconds);
  //   if (tempDiff <= minValue) {
  //     minValue = tempDiff;
  //     topChartKey = key;
  //   }
    // if (keyOrder.has(tempDiff)){
    //   keyOrder.get(tempDiff).push(key);
    // }else {
    //   keyOrder.set(tempDiff, [key]);
    // }
  // })
  //reorder closest, then the rest reverse order 4/4, 4/5, 4/18, should be 4/5, then 4/18, 4/4

  //compare first
  // dateParsedMillisecondsFirst = Date.parse(dateStringKeys[0]);
  // tempDiffFirst = Math.abs(currentMs-dateParsedMillisecondsFirst)
  // //compare last
  // dateParsedMillisecondsLast = Date.parse(dateStringKeys[dateStringKeys.length-1]);
  // tempDiffLast = Math.abs(currentMs-dateParsedMillisecondsLast)

  // let isReverseOrder = true;
  // let topChart;
  // let emojiDatesArray = Object.keys(req.emojiRecordsPerDay);
  // let objectCount = emojiDatesArray.length;

  topChart = req.emojiRecordsPerDay[topChartKey];
  // if (tempDiffFirst <= tempDiffLast){
  //   //show first at the top, no need to resort the list
  //   isReverseOrder = false;
  //    //returns 'first'
  //   topChart = req.emojiRecordsPerDay[Object.keys(req.emojiRecordsPerDay)[0]];
  // }else{
  //   //last is at the top , and display in reverse order
  //   isReverseOrder = true;
  //   topChart = req.emojiRecordsPerDay[Object.keys(req.emojiRecordsPerDay)[objectCount-1]];
  // }

  const topDate = (new Date(Date.parse(topChart[parseInt(0)].date_time))).toLocaleDateString('en-US',{ timeZone: 'America/Los_Angeles'});
  // const queryDate = (topDate.split('/').join('-'));
  res.render(`history`, {
    path:path,
    emojiDatesArray: emojiDatesArray,
    topDate: topDate,
    topChart: topChart,
    // isReverseOrder: isReverseOrder,
    // currentMillisecond: currentMs,
    isInstructor: tmp,
    records: req.records,
    postedRecordsPerDay: req.emojiRecordsPerDay,
    userInfo: req.userInfo,
    history_chart_access: req.history_chart_access,
    history_text_access: req.history_text_access,
    classLinkId: req.classLinkId,
    classId: req.class_id
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

//
// router.get(
//   "/history",
//   checkIfUserIsInstructor,
//   getClassID,
//   getEmojiRecordsPerMinute,
//   getText,
//   getUserVisibility,
//   (req, res) => {
//     let tmp = false;
//     if (req.isInstructor === 1) {
//       tmp = true;
//     }
//     res.render("history", {
//       isInstructor: tmp,
//       records: req.records,
//       userInfo: req.userInfo,
//       history_chart_access: req.history_chart_access,
//       history_text_access: req.history_text_access,
//     });
//   }
// );
//
// router.post(
//   "/history",
//   checkIfUserIsInstructor,
//   getClassID,
//   getEmojiRecordsPerMinute,
//   getText,
//   getUserVisibility,
//   updateUserVisibility,
//   (req, res) => {
//     // console.log("req.body.history_chart_access: "+req.body.history_chart_access);
//     let tmp = false;
//     if (req.isInstructor === 1) {
//       tmp = true;
//     }
//
//     res.render("history", {
//       isInstructor: tmp,
//       records: req.records,
//       userInfo: req.userInfo,
//       history_chart_access: req.history_chart_access,
//       history_text_access: req.history_text_access,
//     });
//   }
// );
