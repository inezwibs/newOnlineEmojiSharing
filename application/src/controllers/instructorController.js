const db = require("../configs/database.js");
const registerService = require ("./../services/registerServices");
const InstructorService = require( "../services/instructorServices" );
const instructorService = new InstructorService();
const {url} = require("url");

let instructorObj ={};
let instructorClassesObj={};
let path = 'http://emotionthermometer.online/EmojiSharing?classLinkId=';
let localPath = 'http://localhost:4000/EmojiSharing?classLinkId=';
let doesClassExist = false;

async function getInstructorPage (req,res,user) {
    console.log(req);
    console.log(res.locals);
    console.log(instructorObj);
    if (typeof req.user === 'object' && req.user !== null){
        res.instructorId = req.user.user[0].id;
    }else if (instructorObj){
        res.instructorId = instructorObj[0].id;
    }else if(typeof req.user === 'number' ){
        res.instructorId = req.user;
    }
    let query =
        " SELECT * FROM emojidatabase.users where id = '" + res.instructorId + "' and isInstructor = 1";

    try{
        const [rows, err ] = await db.execute(query);
        if (rows && rows.length == 0 || rows == null){
            //not an instructor
            let message = "This user is not registered as an instructor."
            return res.render("classLinkPage.ejs" ,{
                classObj: {},
                path : path,
                message: message
            });
        }else if (rows && rows.length > 0 ){
            instructorObj = rows[0];
        }
    }catch(e){
        console.log('error' , e)
    }
    let instructorClassesArray = await getInstructorClasses(res.instructorId);
    let instructorClassNamesArray = await getInstructorClassNames(instructorClassesArray);
    if (instructorClassNamesArray === 0 && instructorObj.isInstructor !== 1){
        message = "This user is not a registered instructor."
        return res.render("classLinkPage.ejs" ,{
            classObj: classObj,
            path : path,
            message: message
        });
    }
    return res.render("instructorAccount.ejs" ,{
        instructorObject : instructorObj,
        newInstructor : instructorObj.full_name,
        classes : instructorClassesArray,
        classNames : instructorClassNamesArray,
        path : localPath,
        alerts : res.alerts
    });
};

async function checkLoggedIn (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect("/instructorLogin");
    }else {
        let userId;
        if (typeof req.user === 'object' && req.user !== null){
            userId = req.user.user[0].id;
        } else if (typeof req.user === 'number' ){
            userId = req.user;
        }
        let query = "SELECT id,isInstructor FROM emojidatabase.registrations where users_id = '" + userId + "'";
        try{
            const[rows,fields] = await db.execute(query);
            //check students who are not in registration because they didn't have class link
            if (rows === undefined || rows.length ===0 || (rows && rows[0].isInstructor === 0)){
                message = "This user is not a registered instructor."
                return res.render('classLinkPage', {
                    classObj: classObj,
                    path : path,
                    message: message
                });// students can input instructor name and class date time
            }else if (rows && rows[0].isInstructor === 1){
                //for instructor
                next();
            }
        }catch (e) {

        }
    }
};

let getInstructorLoginPage = (req,res) => {
    let message = "";
    if (req.user && req.user.message){
        message = req.user.message;
        return res.render("instructorLogin",{
            message: message
        })
    }else if (req.session.flash && req.session.flash.error.length > 0){
        message = req.session.flash.error[0];
        return res.render("instructorLogin",{
            message: message
        })
    }else{
        return res.render("instructorLogin",{
            message: ""
        });
    }
};

let getInstructorRegisterPage = (req,res) => {
    return res.render("instructorRegister")
};

//insert instructor to db users
async function insertInstructor(req, res, next) {


    let newInstructor = {
        fullName: req.body.name,
        email: req.body.email,
        password: req.body.password,
        isInstructor: 1,
        instructorId: '',
    };

    try {
        //create new instructor
        const result = await registerService.createNewInstructor(newInstructor);
        if (result.success){
            req.instructorId = result.body[0].instructorId;
            req.alert = [result.body.message];
        }else if (!result.success){
            if (result.body.length > 0){
                req.instructorId = result.body[0].id;
                req.alert = [result.body.message];
            }else{
                throw new Error(result.message);
            }
        }
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function getInstructorID(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.users where id = " + req.instructorId;

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
    req.body.instructorObject = instructorService.parseInstructorObject(req.body);
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
                const [res, err] = await db.execute(query);
                req.insertedClassId = res.insertId;
                next();
            } catch (e) {
                console.log("Catch an error: ", e);
            }

        }else{
            console.log('Class already exist')
            doesClassExist = true;
            let tempResult = await instructorService.getClassID(req.body);
            if (tempResult.success){
                req.insertedClassId = tempResult.body[0].id;
            }
            let classIsRegisteredResult = await instructorService.getClassRegistrationID(req.body, req.insertedClassId);
            if (classIsRegisteredResult.success && classIsRegisteredResult.body.length > 0 ){
                req.classIsRegisteredResult = true;
            }else if (classIsRegisteredResult.success && classIsRegisteredResult.body.length === 0 ){
                req.classIsRegisteredResult = false;
            }else{
                throw new Error();
            }
            res.locals = req.body;
            instructorClassesObj = res.locals;
            next();
        }
    }catch (e) {
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
    if (typeof req.user == 'string'){
        userId = req.user.id;
    }else if (instructorObj.length > 0 ){
        userId = instructorObj.id;
    }else if (typeof req.user == 'object'){
        userId = req.user.user[0].id;
    }
    if (!doesClassExist || doesClassExist && !req.classIsRegisteredResult){
        try{
            let doesInstructorExist = await instructorService.checkExistingInstructor(req.body);

            if (doesInstructorExist.success && doesInstructorExist.body.length > 0 ){
                let query =
                    " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
                    req.insertedClassId +
                    " ," +
                    userId +
                    " , 1 )";
                try{
                    const [res,err] = await db.execute(query);
                    req.insertedClassRegId = res.insertId;
                }catch (e) {
                    console.log("Catch an error: ", e);
                }
            }
            next();
            //get the reg id from the entered classes
        }catch (e) {
            console.log("Catch an error: ", e);
        }
    }else {
        next();
    }

}

async function generateLink(req, res, next) {

    currentInstructor = instructorObj.id ? instructorObj.id : req.body.instructorObject.id;
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
        return res.redirect("/instructorLogin",{
            message: ""
        });
    });
}



module.exports = {
    insertInstructor:insertInstructor,
    getInstructorID: getInstructorID,
    insertClasses:insertClasses,
    insertToRegistration:insertToRegistration,
    generateLink:generateLink,
    getInstructorPage: getInstructorPage,
    getInstructorLoginPage:getInstructorLoginPage,
    getInstructorRegisterPage: getInstructorRegisterPage,
    checkedInstructor: checkedInstructor,
    checkLoggedIn: checkLoggedIn,
    postLogOut:postLogOut
};


