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



module.exports = router;
