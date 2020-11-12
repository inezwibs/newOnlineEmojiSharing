const express = require("express");
const router = express.Router();
const db = require("../models/database.js");



async function checkIfUserIsInstructor(req, res, next) {
    let query = " SELECT * FROM emoji_db.registerations where id = "+req.query.reg_id;

    await db.execute(query, (err, res) => {
        // console.log(query);
        if (err) throw err;
        req.isInstructor = res[0].isInstructor;
        next();
    });
}

async function getClassID(req, res, next) {
    let query = " SELECT * FROM emoji_db.registerations where id = "+req.query.reg_id;    
    await db.execute(query, (err, res) => {
        // console.log(query); 
        req.class_id = res[0].classes_id;
        next();     
    });
}

async function getEmojiRecordsPerMinute(req, res, next) {
    let query = " SELECT * FROM emoji_db.emojiRecordsPerMinute where classes_id = "+req.class_id;

    await db.execute(query, (err, records) => {
        // console.log(query);
        if (err) throw err;
        req.records = records;
        // console.log("records[0].min: "+records[0].min);
        next();
    });
}
//get class id
//getEmojiRecordsPerMinute and send that to front
//from there loop over the length


async function getText(req, res, next) {
    let query = ` SELECT P.date_time, P.emojies_id, P.text, U.full_name
    FROM emoji_db.posted_emojies P
     join emoji_db.registerations R on P.registeration_id = R.id
     join emoji_db.users U on U.id = R.users_id where length(text)>0 `;

    await db.execute(query, (err, userInfo) => {
        // console.log(query);
        if (err) throw err;
        req.userInfo = userInfo;
        // console.log("userInfo: "+userInfo);
        next();
    });
}


async function updateUserVisibility(req, res, next) {
    var historChartAccess = req.history_chart_access;
    if(req.body.history_chart_access !== undefined){
        historChartAccess = req.body.history_chart_access;
    }
    var historTextAccess = req.history_text_access;
    if(req.body.history_text_access !== undefined){
        historTextAccess = req.body.history_text_access;
    }
    let query = " UPDATE emoji_db.classes set history_chart_access = "+historChartAccess+", history_text_access = "+historTextAccess+" where id ="+req.class_id;

    await db.execute(query, (err, userInfo) => {
        // console.log(query);
        // console.log("chart: "+req.body.history_chart_access);
        // console.log("text: "+req.body.history_text_access);
        if (err) throw err;
        next();
    });
}

async function getUserVisibility(req, res, next) {
    let query = " select * from emoji_db.classes where id ="+req.class_id;

    await db.execute(query, (err, classInfo) => {
        // console.log(query);
        if (err) throw err;
        req.history_chart_access = classInfo[0].history_chart_access;
        req.history_text_access = classInfo[0].history_text_access;
        next();
    });
}



router.get("/history",checkIfUserIsInstructor, getClassID,getEmojiRecordsPerMinute,getText,getUserVisibility, (req, res) => {

    let tmp = false;
    if (req.isInstructor === 1){
        tmp = true;
    }
    res.render("history", {
        isInstructor: tmp,
        records : req.records,
        userInfo : req.userInfo,
        history_chart_access : req.history_chart_access,
        history_text_access : req.history_text_access
    });
});



router.post("/history", checkIfUserIsInstructor,getClassID,getEmojiRecordsPerMinute, getText,getUserVisibility, updateUserVisibility,(req, res) => {

    // console.log("req.body.history_chart_access: "+req.body.history_chart_access);
    let tmp = false;
    if (req.isInstructor === 1){
        tmp = true;
    }
    
    res.render("history", {
        isInstructor: tmp,
        records : req.records,
        userInfo : req.userInfo,
        history_chart_access : req.history_chart_access,
        history_text_access : req.history_text_access

    });
});

module.exports = router;