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
        instructorController.insertToRegistration, instructorController.generateLink,
        instructorController.generateLinkPage);

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

    // // Logs in user
// router.post("/login",
//   passport.authenticate("local", {
//     successRedirect: "/sendEmoji",
//     failureRedirect: "/login/failed",
//     failureFlash: false
//   })
// );

    //post /instructorLogin needed
    router.get("/instructorRegister", instructorController.getInstructorRegisterPage);
    router.post("/instructorRegister",instructorController.insertInstructure,
        instructorController.getInstructorID,instructorController.checkedInstructor);




    return app.use("/", router);
};
module.exports = initWebRoutes

//
//
// router.post("/",
//     instructorController.insertInstructure,
//     instructorController.getInstructorID,
//     instructorController.insertClasses,
//     instructorController.getClassID,
//     instructorController.insertToRegistration,
//     (req, res) => {
//         res.redirect(
//             url.format({
//                 pathname: "/generateLink",
//                 query: {
//                     classID: req.classID,
//                 },
//             })
//         );
//     }
// );
