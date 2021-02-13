const express = require('express');
const instructorController = require("../controllers/instructorController");


let router = express.Router();


let initWebRoutes = (app) => {
    router.get('/instructor', instructorController.getInstructorPage);
    router.post('/instructor', instructorController.insertInstructure);

    router.get("/", instructorController.getWelcomePage);
    router.post("/",
        instructorController.insertInstructure,
        instructorController.getInstructorID,
        instructorController.checkedInstructor
        // (req, res) => {
        //     res.redirect('/instructor'
        //         // url.format({
        //         //     //was generate link before /instructor
        //         //     pathname: "/instructor",
        //         //     query: {
        //         //         instructorID: req.instructorID,
        //         //     },
        //         // })
        //     );
        // }
    );
    // '/instructor'

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
