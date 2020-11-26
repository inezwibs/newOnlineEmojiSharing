/*
1. get the form data 
2. check instructure name not exist
2. fill the instructor table
3. check class table not exists
3. fill the class table
4. show class link in the page
*/

const express = require("express");
const router = express.Router();
const db = require("../models/database.js");
const url = require('url');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

async function insertInstructure(req, res, next) {
    const hash = bcrypt.hashSync(req.body.password, saltRounds);
    console.log("hellloooo1"); 
    // console.log(hash);
    // console.log(req.body.name);
    let query = " INSERT INTO emoji_db.users (full_name, email, password, isInstructor) VALUES ( '" +req.body.name+ "' , '"+ req.body.email +"' , '"+ hash +"', 1)";
    // console.log(query);
    // try{
    //     await db.execute(query, (err, res) => {
    //         console.log(query); 
            
    //         // you can show alert if the user is already exists
    //         if (err) throw err;
    //         next();
    //     });
    // }
    // catch(e) {
    //     console.log('Catch an error: ', e)
    //   }
    try{
        await db.execute(query);
        console.log(query); 
        next();
    }
    catch(e) {
        console.log('Catch an error: ', e)
    }
}

async function getInstructorID(req, res, next) {

    let query = " SELECT * FROM emoji_db.users where email = '"+req.body.email+"'";
    console.log("hellloooo2"); 
    // try {
    //     await db.execute(query, (err, res) => {
    //         if (err) throw err;
    //         console.log(query); 
    //         req.instructorID = res[0].id;
    //         // console.log(req.instructorID);    
    //         next();
    //     });
    //   }
    //   catch(e) {
    //     console.log('Catch an error: ', e)
    //   }
    try{
        res = await db.execute(query);
        console.log(query); 
        req.instructorID = res[0].id;
        next();
    }
    catch(e) {
        console.log('Catch an error: ', e)
    }

    
}

async function insertClasses(req, res, next) {
    // let query = " SELECT * FROM emoji_db.instructors where email = '"+req.body.email+"'";
    let query = " INSERT INTO emoji_db.classes (id, class_name, datetime, startTime, endTime ) VALUES ( " +req.instructorID+ " ,'" +req.body.className+ "' , '"+ req.body.weekday+ "-" + req.body.startTime + ","+req.body.endTime+ "' , '"+ req.body.startTime  +"', '"+ req.body.endTime+"' )";
    // try{
    //     await db.execute(query, (err, res) => {
    //         console.log(query);
    //         if (err) throw err;
    //         next();
    //     });
    // }
    // catch(e) {
    //     console.log('Catch an error: ', e)
    //   }
    try{
        res = await db.execute(query);
        console.log(query); 
        // req.instructorID = res[0].id;
        next();
    }
    catch(e) {
        console.log('Catch an error: ', e)
    }

}
async function getClassID(req, res, next) {
    let query = " SELECT * FROM emoji_db.classes where datetime = '"+req.body.weekday+ "-" + req.body.startTime + ","+req.body.endTime+"'";
    // try{
    //     await db.execute(query, (err, res) => {
    //         console.log(query);
    //         req.classID = res[0].id;
    //         // console.log(req.classID);
    //         // you can show alert if the user is already exists
    //         if (err) throw err;
    //         next();
    //     });
    // }
    // catch(e) {
    //     console.log('Catch an error: ', e)
    //   }
    try{
        res = await db.execute(query);
        console.log(query); 
        req.classID = res[0].id;
        next();
    }
    catch(e) {
        console.log('Catch an error: ', e)
    }
}


router.get("/home",(req, res) => {

    res.render("instructor", {


    });
});


async function insertToRegisteration(req, res, next) {
    let query = " INSERT INTO emoji_db.registerations (classes_id, users_id, isInstructor) VALUES ( " +req.classID+ " ," +req.instructorID+ " , 1 )";
//   try{
//     await db.execute(query, (err, res) => {
//         console.log(query);
//         if (err) throw err;
//         next();
//     });
//   }
//   catch(e) {
//     console.log('Catch an error: ', e)
//   }
try{
    res = await db.execute(query);
    console.log(query); 
    // req.classID = res[0].id;
    next();
}
catch(e) {
    console.log('Catch an error: ', e)
}
    
}

router.post("/home", insertInstructure, getInstructorID, insertClasses, getClassID, insertToRegisteration, (req, res) => {
    // console.log("req.classID: ");
    // console.log(req.classID);
    // res.redirect("/generateLink/"+req.classID, {


    // });
    // res.redirect("/generateLink/?"+req.classID);

    res.redirect(url.format({
        pathname: "/generateLink",
        query: {
            "classID": req.classID,
        }
    }));

});

module.exports = router;
