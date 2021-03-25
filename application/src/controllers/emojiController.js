const db = require("../configs/database.js");
const express = require("express");
const {url} = require("url");


async function getStudentClassId(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.registrations where id = '" + req.body.regId +"'";
        // req.body.classID +
        // " and users_id = " +
        // req.user.id ;
    // await db.execute(query, (err, res) => {
    //     console.log(query);
    //     if (err) throw err;
    //     req.reg_id = res[0].id;
    //     next();
    // });
    try {
        const [rows, fields] = await db.execute(query);
        // console.log(query);
        req.user = req.user;
        req.class_id = rows[0].classes_id;
        // console.log('Reg Id',req.reg_id)
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getSendEmojiPage(req,res,next) {
    let idFromUrl = getClassIdFromUrl(req.headers.referer);
    console.log("***inside sendemoji", idFromUrl);
    let userId;
    let userQuery;
    let rowsObj;
    if (req.user) {
        // let userQuery = "SELECT * FROM emojidatabase.users where '" + req.user + "'";
        userId = req.user;
        userQuery = "SELECT u.full_name, c.class_name, c.datetime, r.id, c.id " +
            "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
            "WHERE u.id = r.users_id " +
            "AND c.id = r.classes_id " +
            "AND r.users_id = '" + userId + "'";
    }
    try {
        const [rows, fields] = await db.execute(userQuery);
        if (rows === undefined || rows.length === 0) {
            console.log("User does not exist. Please register.")
        } else {
            rowsObj = rows[0];
        }
        next();
    } catch (e) {
        console.log(e);
    }


        if (idFromUrl) {
            localRegId = idFromUrl;
        } else if (req.query.regId) { // 195?userId=358
            localRegId = getRegIdFromQuery(req.query.regId);
            // localRegId = req.user; // req.user is incorrect
        }
        // req.classId = rows[0].incorrectd
        res.render("emojiSharing", {
                regId: localRegId,
                userId: req.user,
                userObj: rowsObj
            }
        )

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
    req.minute = insertedEmojiMinutes - req.classStartMinutes - 8 * 60;
    // console.log("minute***: "+req.minute);


    let query =
        " INSERT INTO emojidatabase.posted_emojis (isAnonymous, date_time, emojis_id, registration_id, class_id, text, minute) VALUES ( " +
        isAnonymous +
        " ,'" +
        Date() +
        "', " +
        req.body.optradio +
        ", " +
        req.body.regId +
        " ," +
        req.class_id +
        " , '" +
        req.body.fname +
        "', " +
        req.minute +
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
    var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8 * 60;
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
        " SELECT count(*) as count FROM emojidatabase.registrations where classes_id = '" +
        req.class_id + "' AND isInstructor = \'0\'";
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
        req.class_id + " and minute = " + req.minute;
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
    var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8 * 60;
    if (req.recordExists === true) {
        var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8 * 60;
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

// function you can use:
function getRegIdFromQuery(query) {
    const re = /\d+/g;
    return query.match(re)[0];
}

function getClassIdFromUrl(urlPath) {
    const re = /\d+/g;
    return urlPath.match(re)[1];
}


module.exports = {
    getSendEmojiPage: getSendEmojiPage,
    getStudentClassId: getStudentClassId,
    getClassStartTime: getClassStartTime,
    insertEmojiRecord: insertEmojiRecord,
    getInsertedEmojiTime: getInsertedEmojiTime,
    checkRecordExists: checkRecordExists,
    getClassRegisteredStudentsCount: getClassRegisteredStudentsCount,
    getContributedStudentsCount: getContributedStudentsCount,
    insertRecordPerMinute: insertRecordPerMinute,
    getRegIdFromQuery:getRegIdFromQuery
}
