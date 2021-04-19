const express = require("express");
const router = express.Router();
const {getRegIdFromQuery} = require("../controllers/emojiController");

router.get("/EmojiSharing",(req, res) => {
    let dateObj = new Date(Date());
    let dateString = dateObj.toLocaleDateString('en-US',{ timeZone: 'America/Los_Angeles'})
    let dateStringParams = (dateString.split('/')).join('-');
    const numArr = getIdFromQuery(req.url)
        res.render("home", {
            classLinkId: numArr[0],
            classId: numArr[1],
            dateStringParams:dateStringParams
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



module.exports = router;
