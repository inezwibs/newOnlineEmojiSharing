const db = require("../configs/database.js");
const express = require("express");
const {url} = require("url");
let currentEmoji;


async function getStudentClassId(req, res, next) {
    let errors = [];
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

        if (req.user){
            req.user = req.user;
            next();
        }else if (req.body){
            req.user = req.body.userId;
            //most likely won't need this as the body will have user id
            // let query =
            //     " SELECT * FROM emojidatabase.registrations where classes_id = '" + req.class_id +"'";
            //
            // const [rows, fields] = await db.execute(query);
            //
            // // console.log('Reg Id',req.reg_id)
            // req.user = rows[0].users_id;
            next();
        }

    } catch (e) {
        console.log("Catch an error: ", e);
        errors.push( {msg: e})
        res.render("emojiSharing", {
            errors: errors,
            classLinkId: req.classLinkId,
            regId : req.classLinkId,
            classId: req.class_id,//id shows undefined?
            userId: '',
            userObj: '',
            emojiSelected: '',
            isAnonymousStatus: req.body.isAnonymous === "on" ? true : false
        });
    }
}

async function getSendEmojiPage(req,res) {

    let rowsObj;
    let ids;
    const re = /\d+/g;
    let errors = [];

    if (!req.classLinkId || !req.user_id || !req.userEmail){
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
            req.classId = req.body.classId;
        }
    }

    try {
        req.userInfo = req.body.email ? req.body.email : req.user;
        rowsObj = await getEmojiClassData (req.userInfo, req.classLinkId , req.classId )
        //TODO: check when rowObj is undefined
        if (rowsObj === 0 || rowsObj === undefined || rowsObj && rowsObj.length === 0) {
            errorMsg = "This user is not registered to this class. Would you like to look up your class link?"; //which means it is duplicate reg;
            errors.push({msg: errorMsg});
            throw new Error();
        }
    } catch (e) {
        console.log(e);
        errors.push({msg: e});
        if (errors.length > 0){
            res.render('login', {
                errors: errors,
                title: "Login",
                classId: req.classId,
                classLinkId: req.classLinkId,
                isLoggedIn: req.isAuthenticated(),
            })
        }
    }

    //TODO rowsObj showing undefined for new registrants
    let classIdValue = rowsObj.classes_id ? rowsObj.classes_id : req.classId;
    let userIdValue = rowsObj.id;
    let emojiValue = req.body.optradio ? req.body.optradio  : '3';
    res.render("emojiSharing", {
            classLinkId: req.classLinkId,
            regId : req.classLinkId,
            classId: classIdValue,//id shows undefined?
            userId: userIdValue,
            userObj: rowsObj,
            emojiSelected: emojiValue,
            isAnonymousStatus: req.body.isAnonymous === "on"
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
    var splitClassStartTime = classStartEndTimes[0].split(":");
    var classStartMinutes = parseFloat(parseInt(splitClassStartTime[0]) * 60) + parseFloat(splitClassStartTime[1]);
    var splitClassEndTime = classStartEndTimes[1].split(":");
    let minuteEndTime;
    splitClassEndTime[0] === "00" ? minuteEndTime = "24" : minuteEndTime = splitClassEndTime[0]
    var classEndMinutes = parseFloat(parseInt(minuteEndTime) * 60) + parseFloat(splitClassEndTime[1]);

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
        //check if the time mojis are posted are in the time range of the class
        var resultDateArr = checkValidDate(classDaysInInteger,resultArr.slice(lengthArr-2));
        if (resultDateArr.length > 0 ){
            req.currentMinutes = resultDateArr[0]; // we send even if it is 0
            req.currentDate = resultDateArr[1];
            req.classStartMinutes = resultDateArr[2];
        }else {
            req.currentMinutes = 0;
        }
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getEmojiClassData(userInfo, classLinkId, classId) {
    let userQuery;
    // let userInfoType = userInfo.indexOf('@');
    if (userInfo.length > 4) {
        userQuery = "SELECT u.full_name, u.id,  c.class_name, c.datetime, r.classes_id " +
            "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
            "WHERE u.id = r.users_id " +
            "AND c.id = r.classes_id " +
            "AND u.email = '" + userInfo + "'";
    }else {
        userQuery = "SELECT u.full_name, u.id,  c.class_name, c.datetime, r.classes_id " +
            "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
            "WHERE u.id = r.users_id " +
            "AND c.id = r.classes_id " +
            "AND u.id = '" + userInfo + "'";
    }
    let result;
    try {
        const [rows, fields] =  await db.execute(userQuery);
        if (rows === undefined || rows.length === 0) {
            console.log("User does not exist. Please register.")
            result = 0;
        } else if (classId !== 0 || classId !== undefined ){
            rows.forEach( row => {
                var temp = parseInt(classId);
                if (row.classes_id === temp){
                    result = row;
                }
            });
        } else if (classId === 0 || classId === undefined && rows){
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
        if (req.query.regId || req.url) {
            let ids = getIdsFromUrl(req.url);
            let rowsObj = await getEmojiClassData(req.user,ids[0],ids[1])
            if (ids && ids.length === 2 && rowsObj) {
                   res.render("emojiSharing", {
                       classLinkId: ids[0],
                       regId : ids[0],
                        userId : ids[1],
                       classId: rowsObj.classes_id ? rowsObj.classes_id : classId,//id shows undefined?
                       userObj: rowsObj,
                       emojiSelected: req.body ? req.body.optradio : '3',
                       isAnonymousStatus: req.body.isAnonymous === "on" ? true : false
                   });
            }
        }
    }
}
async function checkRecordExistsInPostedEmojis(req, res, next) {
    req.insertMinutes = req.currentMinutes - req.classStartMinutes;
    let query =
        " SELECT * FROM emojidatabase.posted_emojis where minute = " +
        req.insertMinutes +
        " and users_id = " +
        req.user +
        " and class_id = " +
        req.class_id;

    try {
        const [rows, err] = await db.execute(query);
        var recordExistsInPostedEmojis  = false;
        //if record exists then assign to true
        if (rows.length !== 0) {
            recordExistsInPostedEmojis  = true;
        }
        req.recordExistsInPostedEmojis = recordExistsInPostedEmojis;
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function triageBasedOnTime(req,res,next){
    await getClassStartTime(req,res,next);
    if ( req.currentMinutes === 0 ){
        await invalidEmojiPostBranch(req, res, next);
    }else {
        await checkRecordExistsInPostedEmojis(req,res,next);
        await checkRecordExists(req,res,next);
        // await getClassRegisteredStudentsCount(req,res,next);
        // await getContributedStudentsCount(req,res,next);
        next();
    }

}
async function insertRecords(req,res,next){
    await insertEmojiRecord(req,res,next);
    await getClassRegisteredStudentsCount(req,res,next);
    await getContributedStudentsCount(req,res,next);
    await insertRecordPerMinute(req,res,next);
    await getSendEmojiPage(req,res);
}

async function insertEmojiRecord(req, res, next) {
    let isAnonymous = 0;
    if (req.body.isAnonymous !== undefined) {
        isAnonymous = 1;
    }
    //cleaning text of any symbols
    let cleanText = (req.body.freeText).replace(/[^a-zA-Z0-9 ]/g, '');
    // if current minutes 0 means it is not valid so we don't insert it
    // if record exists already we don't insert it again for this minute for this user
    let query;
    if (req.currentMinutes > 0 && req.recordExistsInPostedEmojis === false) {
        query =
            " INSERT INTO emojidatabase.posted_emojis (users_id, isAnonymous, date_time, emojis_id, registration_id, class_id, text, minute) VALUES ( " +
            req.user +
            " , " +
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
            const [rows, err] = await db.execute(query);
            req.posted_record_id = rows.insertId;
            // next();
        } catch (e) {
            console.log("Catch an error: ", e);
        }
    }else {
        query =
            " UPDATE emojidatabase.posted_emojis SET emojis_id = " + req.body.optradio +
            " where users_id =" + req.user + " and minute = " + req.insertMinutes ;

        try {
            const [rows, err] = await db.execute(query);
            req.posted_record_id = rows.insertId;
            // next();
        } catch (e) {
            console.log("Catch an error: ", e);
        }
        // next();
    }
}

async function checkRecordExists(req, res, next) {
    // var minute = req.insertedEmojiMinutes - req.classStartMinutes - 8 * 60;
    let query;
    req.thisMinute = req.insertMinutes ? req.insertMinutes : req.currentMinutes;
    let recordExists = false;

    if (req.thisMinute && req.body.userId && req.class_id){
         query =
            " SELECT * FROM emojidatabase.emojiRecordsPerMinute where min = " +
             req.thisMinute +
            " and users_id = '" +
            req.body.userId +
            "' and classes_id = '" +
            req.class_id + "'";

        try {
            const [rows, err] = await db.execute(query);
            //if record exists then assign to true
            if (rows != null && rows.length !== 0) {
                req.existingRecord = rows[0]; // we use this to update/zero out the existing emoji
                recordExists = true;
            }
            req.recordExists = recordExists;
        } catch (err) {
            req.recordExists = recordExists;
            console.log("Catch an error: ", err);
        }
    }
}

 async function getClassRegisteredStudentsCount(req, res, next) {
    let query =
        " SELECT count(*) as count FROM emojidatabase.registrations where classes_id = '" +
        req.class_id + "' AND isInstructor = \'0\' ";

    try {
        const [rows, err] =  await db.execute(query);
        req.classRegisteredStudentsCount = rows[0].count;
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getContributedStudentsCount(req, res, next) {
    let thisMinute = req.insertMinutes ? req.insertMinutes : req.currentMinutes
    let query =
        " SELECT count(distinct id) as count FROM emojidatabase.posted_emojis where class_id = " +
        req.class_id + " and minute = " + thisMinute;
    try {
        const [rows, fields] = await db.execute(query);
        req.contributedStudentsCount = rows[0].count;
        //TODO modify the way we do this
        req.studentNotContributed =
            req.classRegisteredStudentsCount - req.contributedStudentsCount;
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function resetEmojiRecordHelper(req,res){
    let query;
    /*
        update yourTableName set yourColumnName =if(yourColumnName =yourOldValue,yourNewValue,yourColumnName);
        if columnName matches count_emojithisEmoji set this.emoji
        if columnName starts with count_emoji but not thisEmoji set to 0
         */
    /*
    record exists in this minute,check the users_id
    if the users id is the same and the min is the same then if it's not 0 -1
    if ther users id is not the same and the min is the same then +1 that emoji count
     */
    try {
        //loop through 1-5 skipping this emoji
        if (req.existingRecord.users_id === req.user){
            for (let i = 1; i <= 5; i++){
                if (i === parseInt(req.thisEmoji)){
                    continue;
                }

                query = `UPDATE emojidatabase.emojiRecordsPerMinute SET count_emoji${i} =IF(count_emoji${i} > 0,count_emoji${i}-1,count_emoji${i}) `+
                    ` WHERE min = ${req.insertMinutes} AND classes_id = ${req.class_id} `+
                    `AND date_time = '${req.currentDate}' AND users_id = ${req.body.userId}`
                const [res, err] = await db.execute(query);
            }
        }else if (req.existingRecord.users_id !== req.user){
            req.studentNotContributed = req.studentNotContributed - 1;
        }

    } catch (e) {
        console.log(e);
    }

}
async function insertRecordPerMinute(req, res, next) {
    let gmtIndex = Date().search('GMT')
    let insertDateTimeValue = Date().substring(0,gmtIndex-1);// -1 to remove the space before GMT
    let query;

    req.thisEmoji = req.emojis_id ? req.emojis_id : req.body.optradio ;
    if (req.recordExists === true) {
        // this query if the req user of the existing record is the same
        await resetEmojiRecordHelper(req,res);
        query =
            " UPDATE emojidatabase.emojiRecordsPerMinute SET count_emoji" + req.thisEmoji +
            " = count_emoji" +
            req.thisEmoji  +
            "+1, count_notParticipated = " +
            req.studentNotContributed +
            " where min = " +
            req.insertMinutes +
            " and classes_id = " +
            req.class_id +
            " and date_time = '" +
            req.currentDate +
            "' " +
            " and users_id = " +
            req.body.userId

        try {
            const [res, err] = await db.execute(query);
            //   console.log("first: "+query);
        } catch (e) {
            console.log("Catch an error: ", e);
        }
    } else {
        // req.contributedStudentsCount = req.contributedStudentsCount + 1;
        // req.studentNotContributed = req.classRegisteredStudentsCount - req.contributedStudentsCount;
        query =
            " INSERT INTO emojidatabase.emojiRecordsPerMinute (min, count_emoji" +
            req.thisEmoji +
            ", count_notParticipated, classes_id, date_time, users_id) VALUES ( " +
            req.insertMinutes +
            ", 1 , " +
            req.studentNotContributed+
            ", " +
            req.class_id +
            ", '" +
            req.currentDate +
            "' ," +
            req.body.userId +
            ")";

        try {
            const [res, err] = await db.execute(query);
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
    let classId = req.body.classId;
    let classLinkId = req.body.classLinkId;

    req.session.destroy(function(err) {
        let paramString = classLinkId + '&classId=' + classId;
        return res.redirect('/login?classLinkId=' + paramString);
    });
}


module.exports = {
    getSendEmojiPage: getSendEmojiPage,
    getStudentClassId: getStudentClassId,
    triageBasedOnTime: triageBasedOnTime,
    getClassStartTime: getClassStartTime,
    insertEmojiRecord: insertEmojiRecord,
    insertRecords:insertRecords,
    checkRecordExists: checkRecordExists,
    getClassRegisteredStudentsCount: getClassRegisteredStudentsCount,
    getContributedStudentsCount: getContributedStudentsCount,
    insertRecordPerMinute: insertRecordPerMinute,
    getRegIdFromQuery:getRegIdFromQuery,
    getIdsFromUrl:getIdsFromUrl,
    studentLogOut: studentLogOut,
    invalidEmojiPostBranch:invalidEmojiPostBranch,
    checkRecordExistsInPostedEmojis:checkRecordExistsInPostedEmojis
}
