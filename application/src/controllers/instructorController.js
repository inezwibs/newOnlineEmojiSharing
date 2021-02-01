
const express = require("express");
const router = express.Router();
const db = require("../models/database.js");
const url = require("url");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const databaseController = require("../controllers/databaseController");

let getInstructorPage = (req,res) =>{
    return res.render("instructorAccount.ejs" ,{
    })
};


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


module.exports = {
    getInstructorID: getInstructorID,
    getInstructorPage: getInstructorPage
};
