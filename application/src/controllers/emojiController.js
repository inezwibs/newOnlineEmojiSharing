const db = require("../configs/database.js");
const DateService = require( "../services/dateServices" );
const dateService = new DateService();
let path = 'http://emotionthermometer.online:4000/sendEmoji';
let localPath = 'http://localhost:4000/sendEmoji';
const EmojiService = require( "../services/emojiServices" );
const emojiService = new EmojiService();
const SocketService = require( "../services/socketServices" );
const socketService = new SocketService();
const ParsingService = require( "../services/parsingServices" );
const parsingService = new ParsingService();

let rowsObj = {
    full_name: "default",
    id: "000",
    class_name: "csc_default",
    datetime: "not_available",
    classes_id: "000"
}


 function getUserSocketListener(req,res,next){
    req.usersOnline = socketService.getUserSocketData();
    req.usersRefreshInterval = socketService.getUserRefreshData();
    next();
}


async function getStudentClassId(req, res, next){
    let errors = [];
    req.token = parsingService.getToken();
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

        if (req.body){
            req.user = req.body.userId;

            next();
        }

    } catch (e) {
        console.log("Catch an error: ", e);
        errors.push( {msg: e})
        //setting refresh
        if (req.usersRefreshInterval && req.usersRefreshInterval.threeSecondSwitch === "on" ) {
            req.isThreeSecondRefreshChecked = true;
        }else{
            req.isThreeSecondRefreshChecked = false;
        }
        req.refreshInterval = parsingService.setRefreshInterval(req.isThreeSecondRefreshChecked);
        res.render("emojiSharing", {
            errors: errors,
            classLinkId: req.classLinkId ? req.classLinkId : '',
            regId : req.classLinkId ? req.classLinkId : '',
            classId: req.class_id ? req.class_id : '',//id shows undefined?
            userId: '',
            userObj: '',
            emojiSelected: '',
            isAnonymousStatus: req.body.isAnonymous === "on" ? true : false,
            path: path,
            token: req.token,
            refreshInterval: req.refreshInterval ? req.refreshInterval : 60000,
            isThreeSecondRefreshChecked: req.isThreeSecondRefreshChecked ? req.isThreeSecondRefreshChecked : false
        });
    }
}

async function getSendEmojiPage(req,res) {
    req.token = parsingService.getToken();
    let ids;
    const re = /\d+/g;

    if (req.headers.referer && (req.headers.referer).match(re)?.length > 2){
                ids= getIdsFromUrl(req.headers.referer);
                ids = ids.filter(notPort => notPort !== '4000'); // will return query params that are not the 4000 port
        if (ids && ids.length === 2) {
            req.classLinkId = ids[0];
            req.classId = ids[1];
        }
    } else if (req.user && req.user.body && req.user.body?.classLinkId && req.user.body?.classId) {
        req.classLinkId = req.user.body.classLinkId;
        req.classId = req.user.body.classId;
    } else if (req.body && req.body.classId && req.body.classLinkId){
        req.classLinkId = req.body.classLinkId;
        req.classId = req.body.classId;
    }
    req.usersRefreshInterval = socketService.getUserRefreshData();

    req.isAnonymousStatus = req.query.isAnonymousStatus;
    if (req.usersRefreshInterval && req.usersRefreshInterval.threeSecondSwitch === "on" ){
        req.isThreeSecondRefreshChecked = true;
    }else {
        req.isThreeSecondRefreshChecked = false;
    }
    req.refreshInterval = parsingService.setRefreshInterval(req.isThreeSecondRefreshChecked);

    if (typeof req.user === 'object'){
        req.userInfo = req.user.user[0].id;
    }else if (typeof req.user === 'string'){
        req.userInfo = req.user;
    }

    let errors =[];
        try{
            if (req.userInfo && req.classLinkId && req.classId){

                rowsObj = await getEmojiClassData (req.userInfo, req.classLinkId , req.classId );
                if (rowsObj === 0 || rowsObj === undefined || rowsObj && rowsObj.length === 0) {
                    let errorMsg = "This user is not a registered student to this class. Use the links below to register for this class or look up your class link."; //which means it is duplicate reg;
                    errors.push({msg: errorMsg});
                    // throw new Error(errorMsg);

                    if (errors.length > 0){
                        return res.render('login', {
                            errors: errors,
                            title: "Login",
                            classId: req.classId ? req.classId : '',
                            classLinkId: req.classLinkId ? req.classLinkId : '',
                            isLoggedIn: req.isAuthenticated(),
                        })
                    }
                }else {
                    let classIdValue = rowsObj.classes_id ? rowsObj.classes_id : req.classId;
                    let userIdValue = rowsObj.id;
                    let emojiValue = req.body.optradio ? req.body.optradio  : req.emojiSelected;
                    res.render("emojiSharing", {
                        classLinkId: req.classLinkId ? req.classLinkId : '',
                        regId : req.classLinkId ? req.classLinkId : '',
                        classId: classIdValue ? classIdValue : '',//id shows undefined?
                        userId: userIdValue ? userIdValue : '',
                        userObj: rowsObj,
                        emojiSelected: emojiValue ? emojiValue : "3",
                        isAnonymousStatus: req.body.isAnonymous ? req.body.isAnonymous : req.isAnonymousStatus,
                        path: path,
                        token: req.token,
                        refreshInterval: req.refreshInterval ? req.refreshInterval : 60000,
                        isThreeSecondRefreshChecked: req.isThreeSecondRefreshChecked ? req.isThreeSecondRefreshChecked : false
                    });
                }
            }else{
                throw "One or all of the values necessary are undefined. Please look up your unique class link."
            }

        } catch (e) {
        console.log(e);
        errors.push({msg: e});
            if (errors.length > 0){
                return res.render('login', {
                    errors: errors,
                    title: "Login",
                    classId: req.classId ? req.classId : '',
                    classLinkId: req.classLinkId ? req.classLinkId : '',
                    isLoggedIn: req.isAuthenticated(),
                })
            }
        }


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
function checkValidDate(daysInIntegerArray, classStartEndTimes, startEndTimeArr) {
    // var splitClassStartTime = classStartEndTimes[0].split(":");
    var splitClassStartTime = startEndTimeArr[0].split(":");
    // var classStartMinutes = parseFloat(parseInt(splitClassStartTime[0]) * 60) + parseFloat(splitClassStartTime[1]);
    var classStartMinutes = parseFloat(parseInt(splitClassStartTime[0]) * 60) + parseFloat(splitClassStartTime[1]);

    var splitClassEndTime = startEndTimeArr[1].split(":");
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
        " SELECT datetime,startTime,endTime  FROM emojidatabase.classes where id =  " +
        req.class_id;
    try {
        const [res, err] = await db.execute(query);
        // var splitedClassStartTime = res[0].startTime.split(":");
        var resultArr = res[0].datetime.split(/[,-]/);
        let startEndTimeArr = [res[0].startTime, res[0].endTime];
        resultArr = parsingService.processDaysOnly(resultArr);
        var classDaysInInteger = getIntegerDatetime(resultArr) // -2 because we're getting all the days not the time
        //check if the time mojis are posted are in the time range of the class
        var resultDateArr = checkValidDate(classDaysInInteger,resultArr,startEndTimeArr);
        if (resultDateArr.length > 0 ){
            req.currentMinutes = resultDateArr[0]; // we send even if it is 0
            req.currentDate = resultDateArr[1];
            req.classStartMinutes = resultDateArr[2];
        }else {
            req.currentMinutes = 0;
        }
    } catch (e) {
        console.log("Catch an error: ", e);
        throw e.message;
    }
}

async function getEmojiClassData(userInfo, classLinkId, classId) {
    let userQuery;
    let temp = parseInt(classId);

    // let userInfoType = userInfo.indexOf('@');
    if (userInfo){
        userQuery = "SELECT u.full_name, u.id, u.isInstructor, c.class_name, c.datetime, r.classes_id " +
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
        throw e.message;
    }
    return result;
}

async function invalidEmojiPostBranch(req,res,next) {
    req.token = parsingService.getToken();
    if (req.currentMinutes===0){
        if (req.query.regId || req.url) {
            let ids = getIdsFromUrl(req.url);
            rowsObj = await getEmojiClassData(req.user,ids[0],ids[1]);
            let message = "You have submitted an emotion outside of class time. It will not be recorded."
            if (req.usersRefreshInterval && req.usersRefreshInterval.threeSecondSwitch === "on" ) {
                req.isThreeSecondRefreshChecked = true;
            }else{
                req.isThreeSecondRefreshChecked = false;
            }
            req.refreshInterval = parsingService.setRefreshInterval(req.isThreeSecondRefreshChecked);
            if (ids && ids.length === 2 && rowsObj) {
                   res.render("emojiSharing", {
                       classLinkId: ids[0],
                       regId : ids[0],
                        userId : req.user,
                       classId: rowsObj.classes_id ? rowsObj.classes_id : ids[1],//id shows undefined?
                       userObj: rowsObj,
                       emojiSelected: req.body ? req.body.optradio : '3',
                       isAnonymousStatus: false,
                       alerts: message,
                       path:path,
                       token: req.token,
                       refreshInterval: req.refreshInterval ? req.refreshInterval : 60000,
                       isThreeSecondRefreshChecked: req.isThreeSecondRefreshChecked ? req.isThreeSecondRefreshChecked : false
                   });
            }
        }
    }
}
async function checkRecordExistsInPostedEmojis(req, res, next) {
    req.insertMinutes = req.currentMinutes - req.classStartMinutes;

    req.currentDateString = dateService.parseDateTimeRecord(new Date());

    try {
        let recordDateTimeObj = await dateService.getRecordDate(req.body, req.insertMinutes);
        if (recordDateTimeObj.success && recordDateTimeObj.body.length > 0){
            let recordResult = dateService.findMatchingRecord(req.currentDateString)
            if (recordResult.success){
                req.recordExistsInPostedEmojis = true;
                req.existingRecordInPostedEmojis = recordResult.body;
            } else{// if record date and current date is not the same
                req.recordExistsInPostedEmojis = false
            }
        }else { // if success is false getting from db, or [] is empty
            req.recordExistsInPostedEmojis = false
        }
    } catch (e) {
        console.log("Catch an error: ", e);
        throw e.message;
    }
}

async function triageBasedOnTime(req,res,next){
    req.token = parsingService.getToken();
    let errors=[];
    try{
        await getClassStartTime(req,res,next);
        if ( req.currentMinutes === 0 ){
            await invalidEmojiPostBranch(req, res, next);
        }else { //req.currentminutes will not be 0
            await checkRecordExistsInPostedEmojis(req,res,next);
            await checkRecordExists(req,res,next);
            next();
        }
    }catch (e) {
        console.log("Catch an error: ", e);
        errors.push( {msg: e})
        //setting connection
        if (req.usersRefreshInterval && req.usersRefreshInterval.threeSecondSwitch === "on" ) {
            req.isThreeSecondRefreshChecked = true;
        }else{
            req.isThreeSecondRefreshChecked = false;
        }
        req.refreshInterval = parsingService.setRefreshInterval(req.isThreeSecondRefreshChecked);
        res.render("emojiSharing", {
            errors: errors,
            classLinkId: req.classLinkId ? req.classLinkId : '',
            regId : req.classLinkId ? req.classLinkId : '',
            classId: req.class_id ? req.class_id : '',//id shows undefined?
            userId: '',
            userObj: '',
            emojiSelected: '',
            isAnonymousStatus: req.body.isAnonymous === "on" ? true : false,
            path: path,
            token: req.token,
            refreshInterval: req.refreshInterval ? req.refreshInterval : 60000,
            isThreeSecondRefreshChecked: req.isThreeSecondRefreshChecked ? req.isThreeSecondRefreshChecked : false
        });
    }
}
async function insertRecords(req,res,next){
    let errors =[];
    req.token = parsingService.getToken();
    try{
        await insertEmojiRecord(req,res,next);
        await processRegisteredStudentsCount(req,res,next);
        await processContributedStudentsCount(req,res,next);
        await insertRecordPerMinute(req,res,next);
        await getSendEmojiPage(req,res);
    }catch (e) {
        console.log("Catch an error: ", e);
        errors.push( {msg: e})
        if (req.usersRefreshInterval && req.usersRefreshInterval.threeSecondSwitch === "on" ) {
            req.isThreeSecondRefreshChecked = true;
        }else{
            req.isThreeSecondRefreshChecked = false;
        }
        req.refreshInterval = parsingService.setRefreshInterval(req.isThreeSecondRefreshChecked);

        res.render("emojiSharing", {
            errors: errors,
            classLinkId: req.classLinkId ? req.classLinkId : '',
            regId : req.classLinkId ? req.classLinkId : '',
            classId: classIdValue ? classIdValue : '',//id shows undefined?
            userId: userIdValue ? userIdValue : '',
            userObj: rowsObj,
            emojiSelected: emojiValue ? emojiValue : "3",
            isAnonymousStatus: req.body.isAnonymous ? req.body.isAnonymous : req.isAnonymousStatus,
            path: path,
            token: req.token,
            refreshInterval: req.refreshInterval ? req.refreshInterval : 60000,
            isThreeSecondRefreshChecked: req.isThreeSecondRefreshChecked ? req.isThreeSecondRefreshChecked : false
        });
    }

}

async function processContributedStudentsCount(req, res, next) {
    let errors =[];

    let resultsContributed = await emojiService.getContributedStudentsCountAndId(req.body, req.insertMinutes, req.currentDate);
    if (resultsContributed.success){
        if (resultsContributed.body.id && resultsContributed.body.id.length > 0){
            req.contributedStudentsCount = resultsContributed.body.count;
        }else{
            //empty body
            req.contributedStudentsCount = 0;
        }
    }else{// error
        errors.push(resultsContributed.error);
        res.render('login', {
            errors: errors,
            title: "Login",
            classId: req.classId ? req.classId : '',
            classLinkId: req.classLinkId ? req.classLinkId : '',
            isLoggedIn: req.isAuthenticated(),
        })
    }
    let studentsOnlineNotParticipated = emojiService.getStudentOnlineNotParticipated(req.usersOnline);

    req.studentOnlineNotParticipated = studentsOnlineNotParticipated.length;
    req.studentsOffline = emojiService.getStudentOffline(req.classRegisteredStudentsCount);
}

async function processRegisteredStudentsCount(req, res, next) {
    let errors =[];
    let results = await emojiService.getClassRegisteredStudentsCountAndId(req.body);
    if (results.success){
        if (Object.keys(results.body).length !== 0){
            req.classRegisteredStudentsCount = results.body.count;
        }else { // body empty
            req.classRegisteredStudentsCount = 0;
        }
    }else{
        errors.push(results.error);
        res.render('login', {
            errors: errors,
            title: "Login",
            classId: req.classId ? req.classLinkId : '',
            classLinkId: req.classLinkId ? req.classLinkId : '',
            isLoggedIn: req.isAuthenticated(),
        })
    }
}

async function insertEmojiRecord(req, res, next) {
    if (req.body.isInstructor && req.body.isInstructor === "1"){
        return 0;
    }
    let isAnonymous = 0;
    if (req.body.isAnonymous !== undefined) {
        isAnonymous = 1;
    }
    //cleaning text of any symbols
    let cleanText = (req.body.freeText).replace(/[^a-zA-Z0-9 ]/g, '');
    // if current minutes 0 will not come here, filtered at triage  0 means it is not valid so we don't insert it
    // if record exists already we don't insert it again for this minute for this user
    let query;
    // if (req.currentMinutes > 0 && req.recordExistsInPostedEmojis === false) {
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
        } catch (e) {
            console.log("Catch an error: ", e);
            throw e.message;
        }

}

async function checkRecordExists(req, res, next) {
    req.thisMinute = req.insertMinutes ? req.insertMinutes : req.currentMinutes;

    try {
        let recordDateTimeObject = await dateService.getRecordDateFromEmojiRecords(req.body, req.thisMinute);
        if (recordDateTimeObject.success && recordDateTimeObject.body.length > 0 ){
            //TODO manage the case for when body has more than one use recordDate contains
            let recordResult = dateService.findMatchingRecord(req.currentDateString)
            if (recordResult.success){
                req.recordExists = true;
                req.existingRecord = recordResult.body;
            } else{// if record date and current date is not the same
                req.recordExists = false;
            }
        }else {
            req.recordExists = false;
        }

    } catch (err) {
        console.log("Catch an error: ", err);
        throw err.message;
    }
}

 async function getClassRegisteredStudentsCount(req, res, next) {
    let query =
        " SELECT count(*) as count FROM emojidatabase.registrations where classes_id = '" +
        req.class_id +"'";

    try {
        const [rows, err] =  await db.execute(query);
        req.classRegisteredStudentsCount = rows[0].count;
    } catch (e) {
        console.log("Catch an error: ", e);
        throw e.message;
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
        if (req.existingRecord.users_id.toString() === req.user){
            for (let i = 1; i <= 5; i++){
                query = `UPDATE emojidatabase.emojiRecordsPerMinute SET count_emoji${i} = 0 `+
                    ` WHERE id = '${req.existingRecord.id}'`
                const [res, err] = await db.execute(query);
            }
        }else if (req.existingRecord.users_id.toString() !== req.user){
            req.studentNotContributed = req.studentNotContributed - 1;
        }

    } catch (e) {
        console.log(e);
    }

}

async function insertRecordPerMinute(req, res, next) {
    if (req.body.isInstructor && req.body.isInstructor === "1"){
        return 0;
    }
    let gmtIndex = Date().search('GMT')
    let insertDateTimeValue = Date().substring(0,gmtIndex-1);// -1 to remove the space before GMT
    let query;

    req.thisEmoji = req.emojis_id ? req.emojis_id : req.body.optradio ;

        query =
            " INSERT INTO emojidatabase.emojiRecordsPerMinute (min, count_emoji" +
            req.thisEmoji +
            ", count_offline, count_online_notParticipated, classes_id, date_time, users_id) VALUES ( " +
            req.insertMinutes +
            ", 1 , " +
            req.studentsOffline +
            ", " +
            req.studentOnlineNotParticipated +
            ", " +
            req.class_id +
            ", '" +
            req.currentDate +
            "' ," +
            req.body.userId +
            ")";

        try {
            const [res, err] = await db.execute(query);
                req.insertId = res.insertId;
        } catch (e) {
            console.log("Catch an error: ", e);
            throw e.message;
        }
    // }

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
    console.log(`logout ${req.session.id}`);
    // const socketId = req.session.socketId;
    // if (socketId && io.of("/").sockets.get(socketId)) {
    //     console.log(`forcefully closing socket ${socketId}`);
    //     io.of("/").sockets.get(socketId).disconnect(true);
    // }
    req.session.destroy(function(err) {
        let paramString = classLinkId + '&classId=' + classId;
        return res.redirect('/login?classLinkId=' + paramString);
    });
}

module.exports = {
    getUserSocketListener:getUserSocketListener,
    getSendEmojiPage: getSendEmojiPage,
    getStudentClassId: getStudentClassId,
    triageBasedOnTime: triageBasedOnTime,
    getClassStartTime: getClassStartTime,
    insertEmojiRecord: insertEmojiRecord,
    insertRecords:insertRecords,
    checkRecordExists: checkRecordExists,
    getClassRegisteredStudentsCount: getClassRegisteredStudentsCount,
    // getContributedStudentsCount: getContributedStudentsCount,
    insertRecordPerMinute: insertRecordPerMinute,
    getRegIdFromQuery:getRegIdFromQuery,
    getIdsFromUrl:getIdsFromUrl,
    studentLogOut: studentLogOut,
    invalidEmojiPostBranch:invalidEmojiPostBranch,
    checkRecordExistsInPostedEmojis:checkRecordExistsInPostedEmojis
}
