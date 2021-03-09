const db = require("../configs/database.js");
const express = require("express");


async function getStudentClassId(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.registrations where id = '" + req.query.reg_id +"'";
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
    let userId;
    if (idFromUrl){
        userId = idFromUrl;
    }else{
        userId = req.user;
    }
    res.render("emojiSharing", {
        classId: userId,

    });
}

// function you can use:
function getClassIdFromUrl(urlPath) {
    const re = /\d+/g;
    return urlPath.match( re )[1];
}


module.exports = {
    getSendEmojiPage:getSendEmojiPage,
    getStudentClassId:getStudentClassId
}