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
        // req.reg_id = res[0].id;
        // console.log('Reg Id',req.reg_id)
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getSendEmojiPage(req,res) {
    let idFromUrl = getClassIdFromUrl(req.headers.referer);
    console.log("***inside sendemoji", idFromUrl);
    let classId;
    let userId;
    let userQuery;
    let rowsObj;
    if (req.user ){
        userQuery = "SELECT u.full_name, c.class_name, c.datetime, r.id, c.id " +
        "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
        "WHERE u.id = r.users_id " +
        "AND c.id = r.classes_id " +
        "AND r.users_id = '" + req.user + "'";

        // let userQuery = "SELECT * FROM emojidatabase.users where '" + req.user + "'";
        userId = req.user;
    }else{
        userId = 'Emoji User';
    }
    try{
        const[rows,fields] = await db.execute(userQuery);
        if (rows === undefined || rows.length ===0 ){
            console.log("User does not exist. Please register.")
        }else{
            rowsObj = rows[0];
        }

    }catch (e){
        console.log(e);
    }

    if (idFromUrl){
        localRegId = idFromUrl;
    }
    else if (req.query.regId){ // 195?userId=358
           localRegId = getRegIdFromQuery(req.query.regId);
    //     localRegId = req.user; // req.user is incorrect
    }
    res.render("emojiSharing", {
        regId: localRegId,
        userId: req.user,
        userObj: rowsObj}
    )
}

// function you can use:
function getRegIdFromQuery(query) {
    const re = /\d+/g;
    return query.match( re )[0];
}
function getClassIdFromUrl(urlPath) {
    const re = /\d+/g;
    return urlPath.match( re )[1];
}


module.exports = {
    getSendEmojiPage:getSendEmojiPage,
    getStudentClassId:getStudentClassId
}