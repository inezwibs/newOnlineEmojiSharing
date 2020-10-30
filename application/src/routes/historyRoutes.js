const express = require("express");
const router = express.Router();
const db = require("../models/database.js");



async function checkIfUserIsInstructor(req, res, next) {
    let query = " SELECT * FROM emoji_db.registerations where id = "+req.query.reg_id;

    await db.execute(query, (err, res) => {
        console.log(query);
        if (err) throw err;
        req.isInstructor = res[0].isInstructor;
        next();
    });
}


// async function asyncCall(req, res, next) {
//     console.log('calling');
//     const result = await resolveAfter2Seconds();
//     console.log(result);
//     // expected output: "resolved"
// }


// function myfun (i){
//     setInterval(function() { console.log(i++);

// }, 1000);
// }
// function resolveAfter2Seconds() {
//     let i = 0;
//     return new Promise(myfun => {
//         myfun(3)});
//   }

//   asyncCall();




router.get("/history", (req, res) => {
    res.render("history", {
        

    });
});

router.post("/history", checkIfUserIsInstructor, (req, res) => {
    console.log(req.query.reg_id);
    console.log(req.isInstructor);
    let tmp = false;
    if (req.isInstructor === 1){
        tmp = true;
    }
    
    res.render("history", {
        isInstructor: tmp,

    });
});

module.exports = router;