const db = require("../configs/database.js");
const { ms, s, m, h, d } = require('time-convert')

async function checkIfUserIsInstructor(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.registrations where id = " + req.query.classLinkId;

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

async function getEmojiRecordsPerMinute(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.emojiRecordsPerMinute where classes_id = " +
    req.class_id;

  // await db.execute(query, (err, records) => {
  //     // console.log(query);
  //     if (err) throw err;
  //     req.records = records;
  //     // console.log("records[0].min: "+records[0].min);
  //     next();
  // });
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
    req.userInfo = res;
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
  if (req.isInstructor === 1) {
    tmp = true;
  }
  res.render("history", {
    isInstructor: tmp,
    records: req.records,
    userInfo: req.userInfo,
    history_chart_access: req.history_chart_access,
    history_text_access: req.history_text_access,
    classLinkId: req.classLinkId
  });
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


module.exports = {
  checkIfUserIsInstructor:checkIfUserIsInstructor,
  getClassID:getClassID,
  getEmojiRecordsPerMinute:getEmojiRecordsPerMinute,
  getText:getText,
  getUserVisibility:getUserVisibility,
  updateUserVisibility:updateUserVisibility,
  getHistoryPage:getHistoryPage
}