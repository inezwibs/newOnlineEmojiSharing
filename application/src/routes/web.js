const express = require('express');
const instructorController = require("../controllers/instructorController");
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




    return app.use("/", router);
};
module.exports = initWebRoutes

