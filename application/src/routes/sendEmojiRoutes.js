const express = require("express");
const router = express.Router();
const db = require("../models/database.js");
const url = require('url');



router.get("/sendEmoji",(req, res) => {
    const passRegID = req.query.reg_id;
    // console.log("passRegID: "+passRegID);
        res.render("emojiSharing", {
            reg_id: passRegID,
        });

        


});

async function insertEmojiRecord(req, res, next) {
    let isAnonymous = 0;
    if(req.body.isAnonymouse !== undefined){
        isAnonymous = 1;
    }
    let query = " INSERT INTO emoji_db.posted_emojies (isAnonymous, emojies_id, registeration_id, class_id, text) VALUES ( " +isAnonymous+ " ,"+req.body.optradio+", " +req.query.reg_id+ " ,"+req.class_id+ " , '" +req.body.fname+ "')";
    await db.execute(query, (err, res) => {
        // console.log(query); 
        // console.log("res[0].id: "+res.insertId);
        req.posted_record_id = res.insertId;
        // console.log(query); 

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


async function getClassStartTime(req, res, next) {
    let query = " SELECT startTime as startTime FROM emoji_db.classes where id =  "+req.class_id;    
    await db.execute(query, (err, res) => {   
        console.log("startTime: "+res[0].startTime);
        var tmp = (res[0].startTime).split(':');
        var classStartMinutes = (parseFloat(tmp[0]*60)) + (parseFloat(tmp[1]));
        console.log("classStartMinutes: "+classStartMinutes);
        req.classStartMinutes = classStartMinutes;

        next();     
    });
}


async function getInsertedEmojiTime (req, res, next) {
    let query = " SELECT Time(date_time) as insertedEmojiTime, emojies_id, date_time FROM emoji_db.posted_emojies where id = "+req.posted_record_id;    
    await db.execute(query, (err, res) => {   
        console.log(query); 
        console.log("insertedEmojiTime: "+res[0].insertedEmojiTime);
        var tmp = (res[0].insertedEmojiTime).split(':');
        var insertedEmojiMinutes = (parseFloat(tmp[0]*60)) + (parseFloat(tmp[1]));
        req.insertedEmojiMinutes = insertedEmojiMinutes;
        
        req.emojies_id = res[0].emojies_id;
        req.datetime = res[0].date_time.toISOString().slice(0,10) + ' ' + res[0].date_time.toLocaleTimeString().slice(0,7);
        console.log("insertedEmojiMinutes: "+insertedEmojiMinutes);
        // console.log("req.emojies_id: "+req.emojies_id);
        console.log("req.datetime: "+req.datetime);
        next();     
    });
}

async function checkRecordExists (req, res, next) {
    var minute = req.insertedEmojiMinutes - req.classStartMinutes; 
    let query = " SELECT * FROM emoji_db.emojiRecordsPerMinute where min = " + minute +" and classes_id = "+req.class_id;  
    await db.execute(query, (err, res) => {  
        console.log(query); 
        var recordExists = false;
        if(res.length !== 0){
            recordExists = true;
        }
        req.recordExists = recordExists;
        console.log("res: "+res.length); 
        console.log("recordExists: "+req.recordExists); 
        next();     
    });
}

async function getClassRegisteredStudentsCount (req, res, next) {
    let query = " SELECT count(*) as count FROM emoji_db.registerations where classes_id = "+ req.class_id;
    await db.execute(query, (err, res) => {  
        console.log(query); 
        
        req.classRegisteredStudentsCount = res[0].count;
        console.log("req.classRegisteredStudentsCount: "+req.classRegisteredStudentsCount); 
        next();     
    });
}

async function getContributedStudentsCount (req, res, next) {
    let query = " select count(distinct registeration_id) as count FROM emoji_db.posted_emojies where class_id = "+ req.class_id;
    await db.execute(query, (err, res) => {  
        console.log(query); 
        
        let contributedStudentsCount = res[0].count;
        req.studentNotContributed = req.classRegisteredStudentsCount - contributedStudentsCount;
        console.log("req.studentNotContributed: "+req.studentNotContributed); 
        next();     
    });
}

// select  count(distinct registeration_id) as count FROM emoji_db.posted_emojies where class_id = 130

async function insertRecordPerMinute (req, res, next) {
    var minute = req.insertedEmojiMinutes - req.classStartMinutes;
    if(req.recordExists === true){
        var minute = req.insertedEmojiMinutes - req.classStartMinutes;
        //update count
        let query = " UPDATE emoji_db.emojiRecordsPerMinute SET count_emoji"+req.emojies_id+" = count_emoji"+req.emojies_id+"+1, count_notParticipated = "+req.studentNotContributed+" where min = " + minute +" and classes_id = "+req.class_id; 
        await db.execute(query, (err, res) => {  
            console.log(query); 
    
            next();     
        });
    }else{
         //insert record
        let query = " INSERT INTO emoji_db.emojiRecordsPerMinute (min, count_emoji"+req.emojies_id+", count_notParticipated, classes_id) VALUES ( "+ minute +", 1 , "+req.studentNotContributed+", "+ req.class_id + ") ";
        await db.execute(query, (err, res) => {  
            console.log(query); 
    
            next();     
        });
    }

}

//get class start time & end time
//getRecordTime
//calculate the class start time as minutes = classStartMinutes
//calculate the insertedEmojiTime as minute = insertedEmojiMinutes
// min = insertedEmojiMinutes - classStartMinutes.
//search for class id and minute -> 
    //if exists: 
        //if emoji1 -> update count1, 
        //if emoji2 -> update count2
        //if emoji3 -> update count3
        //if emoji4 -> update count4
        //if emoji5 -> update count5

    //if not exists:
       //check which emoji number student insert then 
          //insert the row and count 1 for that emoji


router.post("/sendEmoji", getClassID, getClassStartTime, insertEmojiRecord, getInsertedEmojiTime, checkRecordExists,getClassRegisteredStudentsCount, getContributedStudentsCount,  insertRecordPerMinute, (req, res) => {
        // res.redirect("emojiSharing", {
        //     reg_id: req.query.reg_id
        // });
        res.redirect(url.format({
            pathname: "/sendEmoji",
            query: {
                "reg_id": req.query.reg_id,
            }
        }));

    // console.log("isAnonymouse: "+req.body.isAnonymouse);
    // console.log("text: "+req.body.fname);
    // console.log("optradio: "+req.body.optradio);
    // console.log("userID: "+req.user.id);
    // console.log("classID: "+req.class_id);
    

    


});

module.exports = router;
