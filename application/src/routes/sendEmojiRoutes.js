const express = require("express");
const router = express.Router();
const db = require("../models/database.js");
const url = require("url");

router.get("/sendEmoji", (req, res) => {
  const passRegID = req.query.reg_id;
  // console.log("passRegID: "+passRegID);
  res.render("emojiSharing", {
    reg_id: passRegID,
  });
});



async function getClassID(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.registrations where id = " + req.query.reg_id;
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

async function getClassStartTime(req, res, next) {
  let query =
    " SELECT startTime as startTime FROM emojidatabase.classes where id =  " +
    req.class_id;
  try {
    const [res, err] = await db.execute(query);
    // console.log("startTime: " + res[0].startTime);
    var splitedClassStartTime = res[0].startTime.split(":");
    var classStartMinutes = parseFloat(splitedClassStartTime[0] * 60) + parseFloat(splitedClassStartTime[1]);
    // console.log("classStartMinutes: " + classStartMinutes);
    req.classStartMinutes = classStartMinutes;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function insertEmojiRecord(req, res, next) {
    let isAnonymous = 0;
    if (req.body.isAnonymouse !== undefined) {
      isAnonymous = 1;
    }
    //calculate the minute of inserted record using req.classStartMinutes
    var tmp = Date().split(" ")[4];
    var splitedInsertedEmojiTime = tmp.split(":");
    var insertedEmojiMinutes = parseFloat(splitedInsertedEmojiTime[0] * 60) + parseFloat(splitedInsertedEmojiTime[1]);
    // console.log("insertedEmojiMinutes***: "+insertedEmojiMinutes);
    req.minute = insertedEmojiMinutes - req.classStartMinutes - 8*60;
    // console.log("minute***: "+req.minute);


    let query =
      " INSERT INTO emojidatabase.posted_emojis (isAnonymous, date_time, emojis_id, registration_id, class_id, text, minute) VALUES ( " +
      isAnonymous +
      " ,'" +
      Date() +
      "', " +
      req.body.optradio +
      ", " +
      req.query.reg_id +
      " ," +
      req.class_id +
      " , '" +
      req.body.fname +
      "', "+
      req.minute+
      ")";

    try {
    //   console.log(query);
      const [res, err] = await db.execute(query);
      // console.log(query);
      req.posted_record_id = res.insertId;
      next();
    } catch (e) {
      console.log("Catch an error: ", e);
    }
  }

async function getInsertedEmojiTime(req, res, next) {
  let query =
    " SELECT  emojis_id, date_time FROM emojidatabase.posted_emojis where id = " +
    req.posted_record_id;
  try {
    const [res, err] = await db.execute(query);
    var insertedEmojiTime = res[0].date_time.split(" ")[4];
    // console.log("insertedEmojiTime: " + res[0].insertedEmojiTime);
    var splitedInsertedEmojiTime = insertedEmojiTime.split(":");
    var insertedEmojiMinutes = parseFloat(splitedInsertedEmojiTime[0] * 60) + parseFloat(splitedInsertedEmojiTime[1]);
    req.insertedEmojiMinutes = insertedEmojiMinutes;
    req.emojis_id = res[0].emojis_id;
    // req.datetime = res[0].date_time.split(" ")[4];
    // console.log("insertedEmojiMinutes: " + insertedEmojiMinutes);
    // console.log("req.datetime: " + req.datetime);
    let time_test = Date().split(" ");
    // console.log("Date.now() " + Date());
    // console.log("time_test[4] " + time_test[4]);
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function checkRecordExists(req, res, next) {
  var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8*60;
//   console.log("minute1 : "+minute);
  let query =
    " SELECT * FROM emojidatabase.emojiRecordsPerMinute where min = " +
    req.minute +
    " and classes_id = " +
    req.class_id;
  // await db.execute(query, (err, res) => {
  //     // console.log(query);
  //     var recordExists = false;
  //     if(res.length !== 0){
  //         recordExists = true;
  //     }
  //     req.recordExists = recordExists;
  //     // console.log("res: "+res.length);
  //     // console.log("recordExists: "+req.recordExists);
  //     next();
  // });
  try {
    const [res, err] = await db.execute(query);
    var recordExists = false;
    if (res.length !== 0) {
      recordExists = true;
    }
    req.recordExists = recordExists;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getClassRegisteredStudentsCount(req, res, next) {
  let query =
    " SELECT count(*) as count FROM emojidatabase.registrations where classes_id = " +
    req.class_id;
  // await db.execute(query, (err, res) => {
  //     console.log(query);

  //     req.classRegisteredStudentsCount = res[0].count;
  //     // console.log("req.classRegisteredStudentsCount: "+req.classRegisteredStudentsCount);
  //     next();
  // });
  try {
    const [res, err] = await db.execute(query);
    // console.log(query);
    req.classRegisteredStudentsCount = res[0].count;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getContributedStudentsCount(req, res, next) {
  let query =
    " SELECT count(distinct registration_id) as count FROM emojidatabase.posted_emojis where class_id = " +
    req.class_id + " and minute = "+req.minute;
  try {
    const [res, err] = await db.execute(query);
    let contributedStudentsCount = res[0].count;
    req.studentNotContributed =
      req.classRegisteredStudentsCount - contributedStudentsCount - 1;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

// select  count(distinct registration_id) as count FROM emojidatabase.posted_emojis where class_id = 130

async function insertRecordPerMinute(req, res, next) {
  var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8*60;
  if (req.recordExists === true) {
    var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8*60;
    // console.log("minute2: "+minute);
    //update count
    let query =
      " UPDATE emojidatabase.emojiRecordsPerMinute SET count_emoji" +
      req.emojis_id +
      " = count_emoji" +
      req.emojis_id +
      "+1, count_notParticipated = " +
      req.studentNotContributed +
      " where min = " +
      req.minute +
      " and classes_id = " +
      req.class_id;
    
    try {
      await db.execute(query);
    //   console.log("first: "+query);
      next();
    } catch (e) {
      console.log("Catch an error: ", e);
    }
  } else {
    //insert record
    let query =
      " INSERT INTO emojidatabase.emojiRecordsPerMinute (min, count_emoji" +
      req.emojis_id +
      ", count_notParticipated, classes_id) VALUES ( " +
      req.minute +
      ", 1 , " +
      req.studentNotContributed +
      ", " +
      req.class_id +
      ") ";
      
    try {
      await db.execute(query);
    //   console.log("second: "+query);
      next();
    } catch (e) {
      console.log("Catch an error: ", e);
    }
  }
}

router.post(
  "/sendEmoji",
  getClassID,
  getClassStartTime,
  insertEmojiRecord,
  getInsertedEmojiTime,
  checkRecordExists,
  getClassRegisteredStudentsCount,
  getContributedStudentsCount,
  insertRecordPerMinute,
  (req, res) => {
    res.redirect(
      url.format({
        pathname: "/sendEmoji",
        query: {
          reg_id: req.query.reg_id,
        },
      })
    );

    // console.log("isAnonymouse: "+req.body.isAnonymouse);
    // console.log("text: "+req.body.fname);
    // console.log("optradio: "+req.body.optradio);
    // console.log("userID: "+req.user.id);
    // console.log("classID: "+req.class_id);
  }
);

module.exports = router;
