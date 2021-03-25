const express = require("express");
const router = express.Router();
const {getRegIdFromQuery} = require("../controllers/emojiController");

router.get("/EmojiSharing",(req, res) => {
    const numArr = getIdFromQuery(req.url)
        res.render("home", {
            classLinkID: numArr[0],
            classID: numArr[1]
        });


});

router.get("/fail",(req, res) => {

        res.render("errorPage", {
        });
});

function getIdFromQuery(query){
    const re = /\d+/g;
    let results = query.match(re);
    return results
}

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
