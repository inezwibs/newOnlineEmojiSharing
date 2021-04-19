const db = require("../configs/database.js");
const express = require("express");
const {url} = require("url");


async function getStudentClassId(req, res, next) {

    try {
        // console.log(query);
        let ids;
        if (req.body && Object.keys(req.body).length !== 0){
            req.class_id = req.body.classId;
            req.classLinkId = req.body.classLinkId;
        } else if ( req.query.classLinkId){
            ids = getIdsFromUrl(req.query.classLinkId);
            req.class_id = ids[1];
            req.classLinkId = ids[0];
        } else if (req.originalUrl){
            ids = getIdsFromUrl(req.originalUrl);
            req.class_id = ids[1];
            req.classLinkId = ids[0];
        } else if (req.url){
            ids = getIdsFromUrl(req.url);
            req.class_id = ids[1];
            req.classLinkId = ids[0];
        }
        let query =
            " SELECT * FROM emojidatabase.registrations where id = '" + req.classLinkId +"'";

        const [rows, fields] = await db.execute(query);

        // console.log('Reg Id',req.reg_id)
        req.user = rows[0].users_id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getSendEmojiPage(req,res,next) {

    let regId;
    let userId;
    let classLinkId;
    let rowsObj;
    let classId;
    let ids;
    const re = /\d+/g;

    if (!req.classLinkId || !req.user_id || !req.user){
        if (req.url && (req.url).match(re)){
            ids= getIdsFromUrl(req.url);
            if (ids && ids.length === 2){
                req.classLinkId = ids[0];
                req.classId = ids[1];
            }
        } else if (req.query.regId && (req.query.regId).match(re)){
            ids= getIdsFromUrl(req.query.regId);
            if (ids && ids.length === 2){
                req.classLinkId = ids[0];
                req.classId = ids[1];
            }
        } else if (req.headers.referer && (req.headers.referer).match(re).length > 2){
                ids= getIdsFromUrl(req.headers.referer);
                req.classLinkId = ids[1];
                req.classId = ids[2];

        } else if (req.body.classLinkId && req.body.userId && req.body.classId) {
            req.classLinkId = req.body.classLinkId;
            req.user = req.body.userId;
            req.classId = req.body.classId;
        }
    }

    try {
        rowsObj = await getEmojiClassData (req.user, req.classLinkId  )

        if (rowsObj === 0 || rowsObj.length === 0) {
            console.log("User does not exist. Please register.")
        }
    } catch (e) {
        console.log(e);
    }

    res.render("emojiSharing", {
            classLinkId: req.classLinkId,
            regId : req.classLinkId,
            classId: rowsObj.classes_id ? rowsObj.classes_id : req.classId ,//id shows undefined?
            userId: req.user_id ?  req.user : '',
            userObj: rowsObj
    });
}
function getIntegerDatetime(daysArray){
    let temp = [];
    daysArray.forEach ( day => {
            switch(day.toLowerCase()){
                case 'monday' :temp.push(1);
                    break;
                case 'tuesday' : temp.push(2);
                    break;
                case 'wednesday' : temp.push(3);
                    break;
                case 'thursday' : temp.push(4);
                    break;
                case 'friday' : temp.push(5);
                    break;
                case 'saturday' : temp.push(6);
                    break;
                case 'sunday' : temp.push(0);
                    break;
                default:
                    return temp;
            }});
    return temp;
// monday 1, tues 2 , wed 3, thur 4 , fri 5, sat 6, sun 7
}
function checkValidDate(daysInIntegerArray, classStartEndTimes) {
    var splitedClassStartTime = classStartEndTimes[0].split(":");
    var classStartMinutes = parseFloat(splitedClassStartTime[0] * 60) + parseFloat(splitedClassStartTime[1]);
    var splitedClassEndTime = classStartEndTimes[1].split(":");
    var classEndMinutes = parseFloat(splitedClassEndTime[0] * 60) + parseFloat(splitedClassEndTime[1]);

    var currentDate = new Date();
    /*current minutes calculation*/
    var day = currentDate.getDay(); //get the of today
    var hours = currentDate.getHours(); // get the hour
    var minutes = currentDate.getMinutes(); // get the minutes

    var currentMinutes = parseFloat(hours * 60) + parseFloat(minutes);

    if (daysInIntegerArray.includes(day)){
        //count minutes if current minutes is between start and end minutes
        if (currentMinutes >= classStartMinutes && currentMinutes <= classEndMinutes){
            return [currentMinutes,currentDate,classStartMinutes];
        }else{
            return 0;
        }
    }else{
        return 0;
    }
}
async function getClassStartTime(req, res, next) {
    let query =
        " SELECT datetime as datetime FROM emojidatabase.classes where id =  " +
        req.class_id;
    try {
        const [res, err] = await db.execute(query);
        // var splitedClassStartTime = res[0].startTime.split(":");
        var resultArr = res[0].datetime.split(/[,-]/);
        var lengthArr = resultArr.length;
        var classDaysInInteger = getIntegerDatetime(resultArr.slice(0,lengthArr-2)) // -2 because we're getting all the days not the time
        var resultDateArr = checkValidDate(classDaysInInteger,resultArr.slice(lengthArr-2));
        if (resultDateArr.length > 0 ){
            req.currentMinutes = resultDateArr[0]; // we send even if it is 0
            req.currentDate = resultDateArr[1];
            req.classStartMinutes = resultDateArr[2];
            next();
        }else {
            req.currentMinutes = 0;
            next();
        }
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getEmojiClassData (userId, regId ) {
    let userQuery = "SELECT u.full_name, c.class_name, c.datetime, r.id, r.classes_id " +
        "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
        "WHERE u.id = r.users_id " +
        "AND c.id = r.classes_id " +
        "AND r.users_id = '" + userId + "'";
    let result;
    try {
        const [rows, fields] =  await db.execute(userQuery);
        if (rows === undefined || rows.length === 0) {
            console.log("User does not exist. Please register.")
            result = 0;
        } else if (regId !== 0 ){
            rows.forEach( row => {
                var temp = parseInt(regId);
                if (row.id === temp){
                    result = row;
                }
            });
        } else if (regId === 0 ){
            //meaning no regId was provided then we pick first one
            result = rows[0];
        }
    } catch (e) {
        console.log(e);
    }
    return result;
}
async function invalidEmojiPostBranch(req,res,next) {
    if (req.currentMinutes===0){
        if (req.query.regId) {
            let ids = getIdsFromUrl(req.url);
            let rowsObj = await getEmojiClassData(ids[1],ids[0])
            if (ids && ids.length === 2 && rowsObj) {
                   res.render("emojiSharing", {
                       classLinkId: ids[0],
                       regId : ids[0],
                        userId : ids[1],
                       classId: rowsObj.classes_id ? rowsObj.classes_id : classId,//id shows undefined?
                       userObj: rowsObj

                   });
            }
        }

    } else {
        next();
    }
}

async function insertEmojiRecord(req, res, next) {
    let isAnonymous = 0;
    if (req.body.isAnonymouse !== undefined) {
        isAnonymous = 1;
    }
    //cleaning text of any symbols
    let cleanText = (req.body.freeText).replace(/[^a-zA-Z0-9 ]/g, '');
    // if current minutes 0 means it is not valid so we don't insert it
    req.insertMinutes = req.currentMinutes - req.classStartMinutes;
    if (req.currentMinutes > 0) {
        let query =
            " INSERT INTO emojidatabase.posted_emojis (isAnonymous, date_time, emojis_id, registration_id, class_id, text, minute) VALUES ( " +
            isAnonymous +
            " ,'" +
            req.currentDate +
            "', " +
            req.body.optradio +
            ", " +
            req.body.classLinkId +
            " ," +
            req.class_id +
            " , '" +
            cleanText +
            "', " +
            req.insertMinutes +
            ")";

        try {
            const [res, err] = await db.execute(query);
            req.posted_record_id = res.insertId;
            next();
        } catch (e) {
            console.log("Catch an error: ", e);
        }
    }else {
        next();
    }
}

async function getInsertedEmojiTime(req, res, next) {
    let query =
        " SELECT  emojis_id, minute FROM emojidatabase.posted_emojis where id = " +
        req.posted_record_id;
    try {
        const [res, err] = await db.execute(query);
        req.emojis_id = res[0].emojis_id;
        req.insertedMinutes = res[0].minute;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function checkRecordExists(req, res, next) {
    // var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8 * 60;
    let query =
        " SELECT * FROM emojidatabase.emojiRecordsPerMinute where min = " +
        req.insertedMinutes +
        " and classes_id = " +
        req.class_id;

    try {
        const [res, err] = await db.execute(query);
        var recordExists = false;
        //if record exists then assign to true
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
        req.class_id + "' AND isInstructor = \'0\' ";

    try {
        const [res, err] = await db.execute(query);
        req.classRegisteredStudentsCount = res[0].count;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getContributedStudentsCount(req, res, next) {
    let query =
        " SELECT count(distinct registration_id) as count FROM emojidatabase.posted_emojis where class_id = " +
        req.class_id + " and minute = " + req.insertedMinutes ;
    try {
        const [rows, fields] = await db.execute(query);
        let contributedStudentsCount = rows[0].count;
        req.studentNotContributed =
            req.classRegisteredStudentsCount - contributedStudentsCount;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function insertRecordPerMinute(req, res, next) {
    let gmtIndex = Date().search('GMT')
    let insertDateTimeValue = Date().substring(0,gmtIndex-1);// -1 to remove the space before GMT

    if (req.recordExists === true) {

        let query =
            " UPDATE emojidatabase.emojiRecordsPerMinute SET count_emoji" +
            req.emojis_id +
            " = count_emoji" +
            req.emojis_id +
            "+1, count_notParticipated = " +
            req.studentNotContributed +
            " where min = " +
            req.insertedMinutes +
            " and classes_id = " +
            req.class_id +
            " and date_time = '" +
            insertDateTimeValue +
            "' "

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
            ", count_notParticipated, classes_id, date_time) VALUES ( " +
            req.insertedMinutes +
            ", 1 , " +
            req.studentNotContributed +
            ", " +
            req.class_id +
            ", '" +
            insertDateTimeValue +
            "') ";

        try {
            await db.execute(query);
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


function getIdsFromUrl(urlPath) {
    const re = /\d+/g;
    let found =  urlPath.match(re);
    return found;
}
async function studentLogOut (req, res) {
    req.session.destroy(function(err) {
        return res.redirect("/login");
    });
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
    getRegIdFromQuery:getRegIdFromQuery,
    getIdsFromUrl:getIdsFromUrl,
    studentLogOut: studentLogOut,
    invalidEmojiPostBranch:invalidEmojiPostBranch
}

//calculate the minute of inserted record using req.classStartMinutes
// var tmp = Date().split(" ")[4];
// var dateArr = Date().split(" ").slice(0, 5);
// var date = dateObj.split(" ");
// var splitedInsertedEmojiTime = tmp.split(":");
// var insertedEmojiMinutes = parseFloat(splitedInsertedEmojiTime[0] * 60) + parseFloat(splitedInsertedEmojiTime[1]);
// console.log("insertedEmojiMinutes***: "+insertedEmojiMinutes);
// req.minute = insertedEmojiMinutes - req.classStartMinutes;
// req.minute = insertedEmojiMinutes - req.classStartMinutes - 8 * 60;
// console.log("minute***: "+req.minute);
