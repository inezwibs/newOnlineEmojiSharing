const express = require('express');
const instructorController = require("../controllers/instructorController");
const studentController = require("../controllers/studentController");
const emojiController = require("../controllers/emojiController");
const historyController = require("../controllers/historyController");
const passport = require('passport');
const initPassportLocal = require( "../controllers/passportController");

// Init all passport
initPassportLocal();

let router = express.Router();

let initWebRoutes = (app) => {
    router.get('/instructor', instructorController.getInstructorPage);
    router.post('/instructor', instructorController.insertClasses, instructorController.getClassID,
        instructorController.insertToRegistration, instructorController.generateLink);

    router.get("/", instructorController.checkLoggedIn, instructorController.getInstructorPage);
    //post / not decided yet
    router.post("/",instructorController.insertInstructure,
        instructorController.getInstructorID,instructorController.checkedInstructor);

    router.get("/instructorLogin", instructorController.getInstructorLoginPage);
    router.post("/instructorLogin", passport.authenticate("local", {
        successRedirect: "/instructor",
        failureRedirect: "/instructorlogin",
        failureFlash: true,
        successFlash: true
    }));
    router.get("/instructorRegister", instructorController.getInstructorRegisterPage);
    router.post("/instructorRegister",instructorController.insertInstructure,
        instructorController.getInstructorID,instructorController.checkedInstructor);
    //student get routes they can't go directly, must get class link
    router.get("/login", studentController.getStudentLoginPage);
    router.post("/login", passport.authenticate("local", {
        successRedirect: "/sendEmoji",
        failureRedirect: "/fail",
        failureFlash: true,
        successFlash: true
    }))
    //student get routes, they can't go directly, must get class link
    router.get("/register", studentController.getStudentRegisterPage);
    router.post("/register", studentController.checkUserIsValid,studentController.insertUser,
    studentController.getUserId,studentController.checkRegistration,studentController.insertRegistration,
    studentController.getRegistrationId,emojiController.getSendEmojiPage);
    //if students lose the class link
    router.get("/getClassLink", studentController.getClassLinkPage);
    router.post("/getClassLink", studentController.listClassLinks);
    //emoji routes
    router.get("/sendEmoji",  emojiController.getSendEmojiPage )
    router.post("/sendEmoji" ,emojiController.getStudentClassId,
        emojiController.getClassStartTime, emojiController.insertEmojiRecord, emojiController.getInsertedEmojiTime,emojiController.checkRecordExists,
        emojiController.getClassRegisteredStudentsCount, emojiController.getContributedStudentsCount,emojiController.insertRecordPerMinute,
        emojiController.getSendEmojiPage)
    //history routes
    router.get("/history",historyController.checkIfUserIsInstructor, historyController.getClassID, historyController.getEmojiRecordsPerMinute, historyController.getText,
        historyController.getUserVisibility,historyController.getHistoryPage)
    router.post("/history", historyController.checkIfUserIsInstructor, historyController.getClassID, historyController.getEmojiRecordsPerMinute, historyController.getText,
        historyController.getUserVisibility, historyController.updateUserVisibility, historyController.getHistoryPage)
    router.post("/logout", instructorController.postLogOut);
    router.get("/logout", instructorController.postLogOut);

    return app.use("/", router);
};
module.exports = initWebRoutes

