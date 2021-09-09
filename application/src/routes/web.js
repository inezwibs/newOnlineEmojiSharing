const express = require('express');
const instructorController = require("../controllers/instructorController");
const studentController = require("../controllers/studentController");
const emojiController = require("../controllers/emojiController");
const historyController = require("../controllers/historyController");
const passwordController = require("../controllers/passwordController")
// const scriptsController = require("../controllers/scriptsController")
const passport = require('passport');
const passportController = require( "../controllers/passportController");

// Init all passport
passportController.initPassportLocal();
let router = express.Router();

let initWebRoutes = (app) => {

    // router.get('/scripts', scriptsController.getIntervalWorker);
    router.get('/instructor', instructorController.getInstructorPage);
    router.post('/instructor', instructorController.insertClasses,
        instructorController.insertToRegistration, instructorController.generateLink);

    router.get("/", instructorController.checkLoggedIn, instructorController.getInstructorPage);
    router.post("/",instructorController.insertInstructor,
        instructorController.getInstructorID,instructorController.checkedInstructor);

    router.get("/instructorLogin", instructorController.getInstructorLoginPage);
    router.post("/instructorLogin", passport.authenticate("local", {
        successRedirect: "/instructor",
        failureRedirect: "/instructorLogin",
        failureFlash: true,
        successFlash: true
    }));
    router.get("/instructorRegister", instructorController.getInstructorRegisterPage);
    router.post("/instructorRegister",instructorController.insertInstructor,
        instructorController.getInstructorID,instructorController.checkedInstructor);

    //student get routes they can't go directly, must get class link
    router.get("/login", studentController.getStudentLoginPage);
    // router.post("/login", passportController.executeAuthenticate);
     router.post("/login", passport.authenticate("local", {
        failureRedirect: "/register",//TODO i think this shold be /login
        failureFlash: true,
        successFlash: true,
        successRedirect: "/sendEmoji"}));
    //student get routes, they can't go directly, must get class link
    router.get("/register", studentController.validateClassLinks, studentController.getStudentRegisterPage);
    router.post("/register", studentController.checkIfUserExists, studentController.checkUserIsValid, emojiController.getSendEmojiPage);
    router.post("/logout", emojiController.studentLogOut);
    router.get("/logout", emojiController.studentLogOut);

    //if students lose the class link
    router.get("/getClassLink", studentController.getClassLinkPage);
    router.post("/getClassLink", studentController.listClassLinks);

    //if students are registered for one class but want to register for another
    router.post("/signUp",studentController.checkIfUserExists, studentController.checkUserIsValid,  emojiController.getSendEmojiPage);

    //emoji routes
    router.get("/sendEmoji",  emojiController.getSendEmojiPage );
    router.post("/sendEmoji" ,emojiController.getUserSocketListener, emojiController.getStudentClassId, emojiController.triageBasedOnTime,
        emojiController.insertRecords);
    //forget password
    router.get("/forget-password", passwordController.getForgotPasswordPage);
    router.post("/forget-password",passwordController.handlePostForgotPasswordPage);
    router.get("/reset-password/:id/:token",passwordController.getResetPasswordPage);
    router.post("/reset-password/:id/:token",passwordController.handlePostResetPasswordPage)

    //accessing using history routes
    router.get("/history/:classLinkId/:classId/:date", historyController.historyChecks);
    router.post("/history/:classLinkId/:classId/:date",historyController.historyChecks);
    //accessing from other pages
    router.get("/history", historyController.historyChecksCurrent);
    router.post("/history", historyController.historyChecksCurrent);
    router.post("/instructorLogout", instructorController.postLogOut);
    router.get("/instructorLogout", instructorController.postLogOut);

    return app.use("/", router);
};

module.exports = initWebRoutes

