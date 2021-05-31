const db = require("../configs/database.js");
const registerService = require ("./../services/registerServices");
const {url} = require("url");

let instructorObj ={};
let instructorClassesObj={};
let path = 'http://emotionthermometer.online:4000/EmojiSharing?classLinkId=';
let localPath = 'http://localhost:4000/EmojiSharing?classLinkId=';


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
    let instructorClassesArray = await getInstructorClasses(instructorId);
    let instructorClassNamesArray = await getInstructorClassNames(instructorClassesArray);
    if (instructorClassNamesArray === 0 && instructorObj.isInstructor !== 1){
        return res.redirect("/");
    }
    return res.render("instructorAccount.ejs" ,{
        newInstructor : instructorObj.full_name,
        classes : instructorClassesArray,
        classNames : instructorClassNamesArray,
        path : path
    });
};

async function checkLoggedIn (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect("/instructorLogin");
    }else {
        //
        let user = req.user;
        let query = "SELECT id,isInstructor FROM emojidatabase.registrations where users_id = '" + user + "'";
        try{
            const[rows,fields] = await db.execute(query);
            //check students who are not in registration because they didn't have class link
            if (rows === undefined || rows.length ===0 || (rows && rows[0].isInstructor === 0)){
                return res.render('classLinkPage');// students can input instructor name and class date time
            }else if (rows && rows[0].isInstructor === 1){
                //for instructor
                next();
            }
        }catch (e) {

        }
    }
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

/*
get class tues thur 15:00 16:00
convert tues and thur to numeric value
current = new Date()
if current.getDay() - class day1  or class day2 == 0
then
get start time, convert to minutes , calculate minutes of class time
currentTimeInMinutes = current.getHours() * 60 + current.getMinutes()
if currentTimeInMinutes is between startTimeInMinutes and endTimeInMinutes

 */

//create classes
async function insertClasses(req, res, next) {
    let isClassUniqueQuery = " SELECT * FROM emojidatabase.classes where class_name = '"+req.body.className+ "'" +
        " and datetime = '" + req.body.weekday + "-" + req.body.startTime + "-" + req.body.endTime + "'";
    try{
        const[rows,fields] = await db.execute(isClassUniqueQuery);
        if (rows === undefined || rows.length ===0){
            let query =
                " INSERT INTO emojidatabase.classes ( class_name, datetime, startTime, endTime ) VALUES ( '" +
                req.body.className +
                "' , '" +
                req.body.weekday + "-" + req.body.startTime + "-" + req.body.endTime +
               "' , '" +
                req.body.startTime +
                "', '" +
                req.body.endTime +
                "' )";
            try {
                await db.execute(query);
                // console.log("insertClasses2");
                // console.log(query);
                // req.instructorID = res[0].id;
                next();
            } catch (e) {
                console.log("Catch an error: ", e);
            }

        }else{
            console.log('Class already exist')
            next();
        }
    }catch (e) {
        console.log("Catch an error: ", e);
    }

    res.locals = req.body;
    instructorClassesObj = res.locals;


}

async function getClassID(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.classes where datetime = '" +
        req.body.weekday +
        "-" +
        req.body.startTime +
        "-" +
        req.body.endTime +
        "'";
    res.locals = req.body;
    // instructorObj = res.locals;
    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        req.classId = res[0].id;
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}


async function getInstructorClasses(instructorId) {
    let checkExistingInstructor = "SELECT * FROM emojidatabase.registrations WHERE users_id='"+
        instructorId + "'";
    try {
        const [rows, fields] = await db.execute(checkExistingInstructor);
        if (rows.length !== 0) {
            console.log('found!');
            return rows;
        } else {
            console.log('not found');
            //new classes id would be last record in database + 1
            return 0;
        }
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getInstructorClassNames(classesArrayFromRegDatabase){
    let classesIdArr = [];
    let classNamesArr = [];
    if (classesArrayFromRegDatabase !==0 ){
        classesArrayFromRegDatabase.forEach( (obj) => {
            classesIdArr.push(obj.classes_id);
        });
        for (let i = 0 ; i<classesIdArr.length; i++){
            let getClassName = "SELECT class_name, datetime FROM emojidatabase.classes WHERE id='"+
                classesIdArr[i] + "'";
            try {
                const [rows, fields] = await db.execute(getClassName);
                if (rows.length !== 0) {
                    console.log('found!');
                    classNamesArr.push(rows);
                } else {
                    console.log('not found');
                    //new classes id would be last record in database + 1
                    return 0;
                }
            } catch (e) {
                console.log("Catch an error: ", e);
            }

        }
        return classNamesArr;
    }else{
        return 0;
    }
}


async function insertToRegistration(req, res, next) {
    let userId;
    if (req.user){
        userId = req.user;
    }else if (instructorObj){
        userId = instructorObj.id;
    }
    let checkExistingInstructor = "SELECT * FROM emojidatabase.registrations WHERE classes_id='"+
        req.classId + "' AND users_id = '" + userId + "'" ;
    let query;
    try{
        const [rows, fields] = await db.execute(checkExistingInstructor);
        if (rows === undefined || rows.length === 0){
            query =
                " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
                req.classId +
                " ," +
                userId +
                " , 1 )";
            try{
                await db.execute(query);
            }catch (e) {
                console.log("Catch an error: ", e);
            }
        }
        next();
            //get the reg id from the entered classes
    }catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function generateLink(req, res, next) {

    currentInstructor = instructorObj.id;
    let query =" SELECT * FROM emojidatabase.registrations where users_id ='" + currentInstructor +"'";

    try {
        const [rows, fields] = await db.execute(query);
        let numClasses = rows.length;
        let classesArray = rows;
        //4000 redirects to http://54.215.121.49:4000/EmojiSharing/?classId=
        let newClassIdLink = 'http://emotionthermometer.online/EmojiSharing?classLinkId=' + rows[numClasses-1].id;
        // let newClassIdLink = "http://54.215.121.49:4000/EmojiSharing?classLinkId=" + rows[numClasses-1].id;

        res.render("generateLink", {
            newClassLink: newClassIdLink,
            newClassId: rows[numClasses-1].classes_id,
            classArr: classesArray,
            path:path,
            newClass: req.body
        });
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}
async function postLogOut (req, res) {
    req.session.destroy(function(err) {
        return res.redirect("/instructorLogin");
    });
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
    checkLoggedIn: checkLoggedIn,
    postLogOut:postLogOut
};


