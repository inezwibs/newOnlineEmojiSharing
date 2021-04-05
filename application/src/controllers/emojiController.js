const db = require("../configs/database.js");
const express = require("express");
const {url} = require("url");


async function getStudentClassId(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.registrations where id = '" + req.body.regId +"'";
        // req.body.classId +
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
        let ids;
        if (!req.userId && req.query.regId){
            ids = getIdsFromUrl(req.query.regId);
            req.user = ids[1];
            req.class_id = ids[0];
        } else if (req.userId){
            req.user = req.userId
        } else if (req.user){
            req.class_id = req.body.classId;
        } else if (rows.length !== 0 ){
            req.user = rows[0].users_id;
            req.class_id = rows[0].classes_id;
        }

        // console.log('Reg Id',req.reg_id)
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
    const re = /\d+/g;

    if (req.classLinkId && req.user_id){
        classLinkId = req.classLinkId;
        userId = req.user_id;
    } else if (req.classLinkId && req.user){
        classLinkId = req.classLinkId;
        userId = req.user;
    } else if (req.url && (req.url).match(re)){
        let ids= getIdsFromUrl(req.url);
        if (ids && ids.length === 2){
            classLinkId = ids[0];
            userId = ids[1];
        }
    } else if (req.query.regId && (req.query.regId).match(re)){
        let ids= getIdsFromUrl(req.query.regId);
        if (ids && ids.length === 2){
            classLinkId = ids[0];
            userId = ids[1];
        }
    } else if (!classLinkId && !userId && req.user){
        let tempQuery = "Select * from emojidatabase.registrations where users_id = '" + req.user + "'";
        try {
            [rows, fields] = await db.execute (tempQuery)

            if (rows === 0 || rows.length === 0) {
                console.log("User does not exist. Please register.")
            } else {
                req.reg = rows;
                classLinkId = rows[0].id;
                userId = req.user;
            }

        } catch (e) {
            console.log(e);
        }

    }

    try {
        rowsObj = await getEmojiClassData (userId, classLinkId )

        if (rowsObj === 0 || rowsObj.length === 0) {
            console.log("User does not exist. Please register.")
        } else {
            next();
        }

    } catch (e) {
        console.log(e);
    }

    res.render("emojiSharing", {
            classLinkId: classLinkId,
            regId : classLinkId,
            classId: rowsObj.classes_id ? rowsObj.classes_id : classId,//id shows undefined?
            userId: userId,
            userObj: rowsObj
        }
    )

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
            req.classRegisteredStudentsCount - contributedStudentsCount;// -1 removing instructor who is also registered
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function insertRecordPerMinute(req, res, next) {
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
            req.insertedMinutes +
            ", 1 , " +
            req.studentNotContributed +
            ", " +
            req.class_id +
            ") ";

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
