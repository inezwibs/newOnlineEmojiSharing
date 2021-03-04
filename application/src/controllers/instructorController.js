const db = require("../configs/database.js");
const registerService = require ("./../services/registerServices");
let instructorObj ={};
let instructorClassesObj={};
let newClassesId = 0;
let instructorClasses =  new Array();


async function getInstructorPage (req,res,user) {
    console.log(req);
    console.log(res.locals);
    console.log(instructorObj);
    let instructorId;
    if (req.user){
        instructorId = req.user;
    }else{
        instructorId = instructorObj[0].id;
    }
    let query =
        " SELECT * FROM emojidatabase.users where id = '" + instructorId + "'";

    try{
        const [rows, err ] = await db.execute(query);
        instructorObj = rows[0];
    }catch(e){
        console.log('error' , e)
    }
    return res.render("instructorAccount.ejs" ,{
        newInstructor : instructorObj.full_name
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
    // let nextClassId = await getNextClassIdForInstructor(req,res);
    let query =
        " INSERT INTO emojidatabase.classes ( class_name, datetime, startTime, endTime ) VALUES ( '" +
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
    instructorClassesObj = res.locals;

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
    // instructorObj = res.locals;
    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        req.classID = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getNextClassIdForInstructor(req,res){
    let instructorId;
    if (req.user){
        instructorId = req.user;
    }else{
        instructorId = instructorObj[0].id;
    }
    let checkExistingInstructor = "SELECT * FROM emojidatabase.registrations WHERE users_id='"+
        instructorId + "'";
    try {
        const [rows, fields] = await db.execute(checkExistingInstructor);
        if (rows.length !== 0) {
            newClassesId = rows.length + 1;
            console.log('found!');

        } else {
            console.log('not found');
            //new classes id would be last record in database + 1
            newClassesId++;
        }
        return newClassesId;
    } catch (e) {
        console.log("Catch an error: ", e);
    }

}


async function insertToRegistration(req, res, next) {
    let checkExistingInstructor = "SELECT * FROM emojidatabase.registrations WHERE classes_id='"+
        req.classID + "' AND users_id = '" + instructorObj.id + "'" ;
    let query;
    try{
        const [rows, fields] = await db.execute(checkExistingInstructor);
        // if (rows.length !== 0) {
        //     newClassesId = rows.length + 1;
        //     console.log('found!');
        // }else {
        //         console.log('not found');
        //         newClassesId++;
        // }
            query =
                " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
                req.classID +
                " ," +
                instructorObj.id +
                " , 1 )";

            //get the reg id from the entered classes
    }catch (e) {
        console.log("Catch an error: ", e);
    }



    try {
        const [rows, fields] =await db.execute(query);
        // console.log(query);
        // req.classID = res[0].id;
        res.locals = req.body;
        instructorClassesObj = res.locals;
        // if(instructorClasses.indexOf(newClassesId) !== -1){
        //     console.log("Value exists!");
        // } else{
        //     console.log("Value does not exists!");
        //     instructorClasses.push(newClassesId);
        // }
        console.log(instructorClassesObj);
        console.log(instructorClasses);
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function generateLink(req, res, next) {
    currentInstructor = instructorObj.id;
    let query =" SELECT * FROM emojidatabase.registrations where users_id ='" + currentInstructor +"'";

    try {
        const [rows, fields] = await db.execute(query);
        // console.log(query);
        // req.classID = instructorClasses.slice(-1)[0];
        // res.redirect('/generateLink'+req.classID)
        // let pasClassID = "13.57.196.89:3000/EmojiSharing/?classID="+classID;
        //if there are more than one
        let numClasses = rows.length;
        let classesArray = rows;
        //4000 redirects to http://54.215.121.49:4000/EmojiSharing/?classID=
        let path = 'http://emotionthermometer.online/EmojiSharing/?classID=';
        let newClassIdLink = "http://emotionthermometer.online/EmojiSharing/?classID=" + rows[numClasses-1].id;
        // let classDetailsArr=[];
        //
        // for (var i =0; i<classesArray.length; i++){
        //     let query="Select * from emojidatabase.classes where id ='" + classesArray[i].id +"'";
        //     const[rows,fields] = db.execute(query)
        //     classDetailsArr.push(rows)
        // }

        res.render("generateLink", {
            newClassLink: newClassIdLink,
            classArr: classesArray,
            path:path
            // classDetailsArr:classDetailsArr
        });
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}


module.exports = {
    insertInstructure:insertInstructure,
    getInstructorID: getInstructorID,
    insertClasses:insertClasses,
    getClassID:getClassID,
    insertToRegistration:insertToRegistration,
    generateLink:generateLink,
    getInstructorPage: getInstructorPage,
    getInstructorLoginPage:getInstructorLoginPage,
    getInstructorRegisterPage: getInstructorRegisterPage,
    checkedInstructor: checkedInstructor,
    checkLoggedIn: checkLoggedIn
};
