const express = require('express');
const instructorController = require("../controllers/instructorController");


let router = express.Router();


let initWebRoutes = (app) => {
    router.get("/", (req, res)=>{
        return res.render("welcome.ejs")
    });

    router.get("/instructor", instructorController.getInstructorPage);
    router.post("/instructor", instructorController.getInstructorID);


    return app.use("/", router);
};
module.exports = initWebRoutes;
