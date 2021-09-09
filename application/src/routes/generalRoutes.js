const express = require("express");
const router = express.Router();
const {getRegIdFromQuery} = require("../controllers/emojiController");
const StudentServices = require( "../services/studentServices" );
const studentServices = new StudentServices();

router.get("/EmojiSharing",async (req, res) => {
    let dateObj = new Date(Date());
    let dateString = dateObj.toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'})
    let dateStringParams = (dateString.split('/')).join('-');
    const numArr = getIdFromQuery(req.url);
    let classDetails;
    let classObj = {};
    if (numArr && numArr.length > 0){
        numArr.filter(notPort => notPort !== '4000'); // will return query params that are not the 4000 port
        if (numArr && numArr.length === 2) {
            classDetails = await studentServices.getUserAndClassDetails(numArr[0],numArr[1]);
        }else {
            return res.render("errorPage", {});
        }
        if (classDetails.success && classDetails.body.length > 0) {
            classObj = classDetails.body[0];
        } else {
            return res.render("errorPage", {});
        }
    }else{
        return res.render("errorPage", {});
    }

    res.render("home", {
        classLinkId: numArr[0],
        classId: numArr[1],
        dateStringParams: dateStringParams,
        classDetails: classObj,
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
