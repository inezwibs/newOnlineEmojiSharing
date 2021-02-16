const db = require("../configs/database.js");
const registerService = require ("./../services/registerServices");
let instructorObj ={};

let getInstructorPage = (req,res) => {
    console.log(req);
    console.log(res.locals);
    console.log(instructorObj);
    return res.render("instructorAccount.ejs" ,{
        newInstructor : instructorObj[0].full_name
    });
};

let checkLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/instructorLogin");
    }
    next();
};

let getInstructorLoginPage = (req,res) => {
    return res.render("instructorLogin")
};

let getInstructorRegisterPage = (req,res) => {
    return res.render("instructorRegister")
};

//insert instructor to db users
async function insertInstructure(req, res, next) {


    let newInstructor = {
        fullName: req.body.name,
        email: req.body.email,
        password: req.body.password,
        isInstructor: 1,
        instructorID: '',
        className:''
    };

    try {
        //create new instructor
        await registerService.createNewInstructor(newInstructor);

        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getInstructorID(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.users where email = '" + req.body.email + "'";
    // console.log("hellloooo2");

    try {
        const [rows, err] = await db.execute(query);
        // console.log(query);
        console.log(rows);
        res.locals = rows
        // res.locals = req.body;
        instructorObj = res.locals;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function checkedInstructor(req, res, next) {
    return res.redirect('/instructor');
}


//create classes
async function insertClasses(req, res, next) {
    // let query = " SELECT * FROM emojidatabase.instructors where email = '"+req.body.email+"'";

    let query =
        " INSERT INTO emojidatabase.classes (id, class_name, datetime, startTime, endTime ) VALUES ( " +
        instructorObj[0].id +
        " ,'" +
        req.body.className +
        "' , '" +
        req.body.weekday +
        "-" +
        req.body.startTime +
        "," +
        req.body.endTime +
        "' , '" +
        req.body.startTime +
        "', '" +
        req.body.endTime +
        "' )";

    // console.log("insertClasses1");
    // console.log(query);
    res.locals = req.body;
    instructorObj = res.locals;

    try {
        await db.execute(query);
        // console.log("insertClasses2");
        // console.log(query);
        // req.instructorID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getClassID(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.classes where datetime = '" +
        req.body.weekday +
        "-" +
        req.body.startTime +
        "," +
        req.body.endTime +
        "'";
    res.locals = req.body;
    instructorObj = res.locals;
    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        req.classID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function insertToRegistration(req, res, next) {
    let query =
        " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
        req.classID +
        " ," +
        req.instructorID +
        " , 1 )";

    res.locals = req.body;
    instructorObj = res.locals;
    console.log(instructorObj);

    try {
        await db.execute(query);
        // console.log(query);
        // req.classID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function generateLink(req, res, next) {
    currentInstructor = req.instructorID;
    let query =" SELECT * FROM emojidatabase.classes where ''" + currentInstructor;

    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        req.classID = res[0].id;
        res.redirect('/generateLink'+req.classID)
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function generateLinkPage(req, res) {
    // console.log(req.query);
    let classID = req.query.classID;
    // let pasClassID = "13.57.196.89:3000/EmojiSharing/?classID="+classID;
    let pasClassID = "http://54.215.121.49:4000/EmojiSharing/?classID=" + classID;

    res.render("generateLink", {
        classID: pasClassID
    });
}

module.exports = {
    insertInstructure:insertInstructure,
    getInstructorID: getInstructorID,
    insertClasses:insertClasses,
    getClassID:getClassID,
    insertToRegistration:insertToRegistration,
    generateLink:generateLink,
    generateLinkPage:generateLinkPage,
    getInstructorPage: getInstructorPage,
    getInstructorLoginPage:getInstructorLoginPage,
    getInstructorRegisterPage: getInstructorRegisterPage,
    checkedInstructor: checkedInstructor,
    checkLoggedIn: checkLoggedIn
};
