const express = require("express");
const router = express.Router();

router.get("/EmojiSharing",(req, res) => {
    // console.log("the class id is: "+req.query.classID);
    const passClassID = req.query.classID;
        res.render("home", {
            classID: passClassID
        });


});

router.get("/fail",(req, res) => {

        res.render("errorPage", {
        });


});

// //instructor login page
// router.get('/', (req,res)=>{
//     res.render('instructorAccount');
// });


// router.get("/history",(req, res) => {

//     res.render("history", {


//     });
// });
//
// router.get("/generateLink",(req, res) => {
//     // console.log(req.query);
//     let classID = req.query.classID;
//     // let pasClassID = "13.57.196.89:3000/EmojiSharing/?classID="+classID;
//     let pasClassID = "http://54.215.121.49:4000/EmojiSharing/?classID="+classID;
//
//     res.render("generateLink", {
//         classID: pasClassID
//     });
// });


module.exports = router;
