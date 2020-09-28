const express = require("express");
const router = express.Router();

router.get("/EmojiSharing",(req, res) => {
    console.log("the class id is: "+req.query.classID);
    const passClassID = req.query.classID;
        res.render("home", {
            classID: passClassID
        });


});

router.get("/fail",(req, res) => {

        res.render("errorPage", {
        });


});

router.get("/sendEmoji",(req, res) => {
    console.log("the class id is: "+req.query.classID);
    const passRegID = req.query.reg_id;
        res.render("emojiSharing", {
            reg_id: passRegID
        });


});

router.get("/generateLink",(req, res) => {
    console.log(req.query);
    let classID = req.query.classID;
    let pasClassID = "http://localhost:3000/EmojiSharing/?classID="+classID;

    res.render("history", {
        classID: pasClassID


    });
});



module.exports = router;