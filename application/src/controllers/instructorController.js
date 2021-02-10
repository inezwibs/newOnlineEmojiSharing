
const express = require("express");
const router = express.Router();
const db = require("../models/database.js");
const url = require("url");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const databaseController = require("../controllers/databaseController");

let getInstructorPage = (req,res) => {
    return res.render("instructorAccount.ejs" ,{
    })
};
let getWelcomePage = (req,res) => {
    return res.render("welcome")
};

//insert instructor to db users
async function insertInstructure(req, res, next) {
    const hash = bcrypt.hashSync(req.body.password, saltRounds);
    // console.log("hellloooo1");
    // console.log(hash);
    console.log("req body name:" , req.body.name);
    let query =
        " INSERT INTO emojidatabase.users (full_name, email, password, isInstructor) VALUES ( '" +
        req.body.name +
        "' , '" +
        req.body.email +
        "' , '" +
        hash +
        "', 1)";

    try {
        await db.execute(query);
        // console.log(query);
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getInstructorID(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.users where email = '" + req.body.email + "'";
    // console.log("hellloooo2");

    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        // console.log("res[0].id: "+res[0].id);
        req.instructorID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

//create classes
async function insertClasses(req, res, next) {
    // let query = " SELECT * FROM emojidatabase.instructors where email = '"+req.body.email+"'";

    let query =
        " INSERT INTO emojidatabase.classes (id, class_name, datetime, startTime, endTime ) VALUES ( " +
        req.instructorID +
        " ,'" +
        req.body.className +
        "' , '" +
        req.body.weekday +
        "-" +
        req.body.startTime +
        "," +
        req.body.endTime +
        "' , '" +
        req.body.startTime +
        "', '" +
        req.body.endTime +
        "' )";

    // console.log("insertClasses1");
    // console.log(query);

    try {
        await db.execute(query);
        // console.log("insertClasses2");
        // console.log(query);
        // req.instructorID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getClassID(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.classes where datetime = '" +
        req.body.weekday +
        "-" +
        req.body.startTime +
        "," +
        req.body.endTime +
        "'";

    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        req.classID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function insertToregistration(req, res, next) {
    let query =
        " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
        req.classID +
        " ," +
        req.instructorID +
        " , 1 )";

    try {
        await db.execute(query);
        // console.log(query);
        // req.classID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

module.exports = {
    insertToregistration:insertToregistration,
    insertClasses:insertClasses,
    getClassID:getClassID,
    insertInstructure:insertInstructure,
    getInstructorID: getInstructorID,
    getInstructorPage: getInstructorPage,
    getWelcomePage:getWelcomePage
};
