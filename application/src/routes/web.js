const express = require('express');
const instructorController = require("../controllers/instructorController");
const initPassportLocal = require( "../controllers/passportController");

// Init all passport
initPassportLocal();

let router = express.Router();


let initWebRoutes = (app) => {
    router.get('/instructor', instructorController.getInstructorPage);
    router.post('/instructor', instructorController.insertInstructure);

    router.get("/", instructorController.getInstructorLoginPage);
    router.post("/",instructorController.insertInstructure,
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
//     instructorController.insertToregistration,
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
