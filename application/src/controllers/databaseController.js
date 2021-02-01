
const express = require("express");
const router = express.Router();
const db = require("../models/database.js");
const url = require("url");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

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




module.exports = {
    insertInstructor: insertInstructure,
};
