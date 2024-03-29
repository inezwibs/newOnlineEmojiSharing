const db = require("../configs/database.js");
const registerService = require ("./../services/registerServices");
const InstructorService = require( "../services/instructorServices" );
const instructorService = new InstructorService();
const {url} = require("url");

let instructorObj ={};
let instructorClassesObj={};
let path = 'http://emotionthermometer.online:4000/EmojiSharing?classLinkId=';
let localPath = 'http://localhost:4000/EmojiSharing?classLinkId=';
let doesClassExist = false;


async function getInstructorPage (req,res,user) {
    console.log(req);
    console.log(res.locals);
    console.log(instructorObj);
    if (typeof req.user === 'object' && req.user !== null){
        res.instructorId = req.user.user[0].id;
    }else if (instructorObj && Object.keys(instructorObj).length > 0 && instructorObj[0] !== undefined){
        res.instructorId = instructorObj[0].id;
        res.instructorObj = instructorObj[0];
    }else if(typeof req.user === 'number' ){
        res.instructorId = req.user;
    }else if (typeof instructorObj === 'object' ){
        res.instructorId = instructorObj.id;
        res.instructorObj = instructorObj
    }
    let instructorClassesArray;
    let instructorClassNamesArray;
    try{
        let queryResult = await instructorService.validateInstructorUser(res.instructorId);

        if (!queryResult.success){
            //not an instructor
            return res.render("classLinkPage.ejs" ,{
                classObj: {},
                path : path,
                message: queryResult.message
            });
        }else if (queryResult.success){
            instructorObj = queryResult.body;
            instructorClassesArray = await instructorService.getInstructorClasses(res.instructorId);
            instructorClassNamesArray = await instructorService.getInstructorClassNames(instructorClassesArray);
            if (instructorClassNamesArray === 0 && instructorObj.isInstructor !== 1){
                let message = "This user is not a registered instructor."
                return res.render("classLinkPage.ejs" ,{
                    classObj: {},
                    path : path,
                    message: message
                });
            }
        }
    }catch (e) {
        if (e.message === undefined){
            req.params.error = e;
        }else{
            req.params.error = e.message;
        }
        return redirectToInstructorLogin(req,res);
    }

    return res.render("instructorAccount.ejs" ,{
        instructorObject : instructorObj,
        newInstructor : instructorObj.full_name,
        classes : instructorClassesArray,
        classNames : instructorClassNamesArray,
        path : path,
        alerts : res.alerts
    });
}

async function checkLoggedIn (req, res, next) {
    let isAuthenticated = req.isAuthenticated();
    let message;
    let classObj;
    if (!isAuthenticated) { // if user is not authenticated yet then
        return res.redirect("/instructorLogin");
    }else {
        let userId;
        if (isAuthenticated){
            let userObj = req.session.passport.user.user[0];
            userId = userObj.id;
        }else if (typeof req.user === 'object' && req.user !== null){
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
                    classObj: classObj ? classObj : {},
                    path : path,
                    message: message
                });// students can input instructor name and class date time
            }else if (rows && rows[0].isInstructor === 1){
                //for instructor
                next();
            }
        }catch (e) {
            req.params.error = e.message;
            return redirectToInstructorLogin(req,res);

        }
    }
}

let getInstructorLoginPage = (req,res) => {
    let message = "";
    if (req.session.flash && req.session.flash.error.length > 0){
        message = req.session.flash.error[req.session.flash.error.length - 1] ; // getting the latest error message in this session
    }

    return res.render("instructorLogin",{
        message: message
    });

};

let getInstructorRegisterPage = (req,res) => {
    return res.render("instructorRegister")
};

//insert instructor to db users
async function insertInstructor(req, res, next) {
    let errors = [];
    let newInstructor = {
        fullName: req.body.name ? req.body.name: '',
        email: req.body.email ? req.body.email : '',
        password: req.body.password ? req.body.password : '' ,
        isInstructor: 1,
        instructorId: '',
    };

    try {
        //create new instructor
        if (newInstructor){
            const result = await registerService.createNewInstructor(newInstructor);
            if (result.success){
                req.instructorId = result.body.instructorId;
                req.alert = [result.message];
            }else if (!result.success){
                //TODO need to handle empty body object
                if (typeof result.body !== "undefined" && result.body.id){
                    req.instructorId = result.body.id;
                    req.alert = [result.message];
                }else{
                    throw result.message;
                }
            }
            next();
        }else{
            throw "Instructor undefined. Please create a new account if you are an instructor, or look up your class link if you are a student.";
        }

    } catch (e) {
        console.log("Catch an error: ", e);
        errors.push({msg: e});
        return res.render("instructorRegister" ,{
            errors : errors
        });
    }
}

async function getInstructorID(req, res, next) {
    let errors=[];
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
        let message = "No instructor found with this email in the database."
        errors.push({msg: message});
        return res.render("instructorRegister" ,{
            errors : errors
        });
    }
}

async function checkedInstructor(req, res, next) {
    return res.redirect('/instructor');
}

//create classes
async function insertClasses(req, res, next) {
    let errors =[]
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
                doesClassExist = true;
                next();
            } catch (e) {
                console.log("Catch an error: ", e);
                throw e.message;
            }

        }else{
            console.log('Class already exist')
            doesClassExist = true;
            let tempResult = await instructorService.getClassID(req.body);//return error
            if (tempResult.success){
                req.insertedClassId = tempResult.body[0].id;
                req.insertedClass = tempResult.body[0];
            }else{
                throw tempResult.body;
            }
            let classIsRegisteredResult = await instructorService.getClassRegistrationID(req.body, req.insertedClassId);
            if (classIsRegisteredResult.success && classIsRegisteredResult.body.length > 0 ){
                req.classIsRegisteredResult = true;
            }else if (classIsRegisteredResult.success && classIsRegisteredResult.body.length === 0 ){
                req.classIsRegisteredResult = false; //testing
            }else{
                throw classIsRegisteredResult.body;
            }
            res.locals = req.body;
            instructorClassesObj = res.locals;
            next();
        }
    }catch (e) {
        console.log("Catch an error: ", e);
        req.params.error = [];
        // if (errors.length > 0){
        //     req.params.error = errors; // add array
        // }
        if (e.message !== undefined) {
            req.params.error.push({msg: e.message});
        }else{
            req.params.error.push({msg:e});
        }
        return redirectToInstructorLogin(req,res);
    }
}

async function insertToRegistration(req, res, next) {
    let errors = [];
    let userId;
    if (typeof req.user == 'string'){
        userId = req.user.id;
    }else if (instructorObj.length > 0 ){
        userId = instructorObj.id;
    }else if (typeof req.user == 'object'){
        userId = req.user.user[0].id;
    }else if (typeof req.body.instructorObject == 'object'){
        userId = req.body.instructorObject.id;
    }
    if ( doesClassExist && !req.classIsRegisteredResult ){
        try{
            //TODO need to go users table not registration table
            let doesInstructorExist = await instructorService.checkExistingInstructorClasses(req.body);// return error

            if (doesInstructorExist.success && req.insertedClassId && userId ){
                let query =
                    " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
                    req.insertedClassId +
                    " ," +
                    userId +
                    " , 1 )";
                try{
                    const [res,err] = await db.execute(query);
                    req.insertedClassRegId = res.insertId;
                    next();
                }catch (e) {
                    console.log("Catch an error: ", e);
                    throw e;
                }
            }else{
                errors.push({msg:doesInstructorExist.error});
                throw errors;
            }
        }catch (e) {
            req.params.error = [];
            console.log("Catch an error: ", e);
            if (errors.length > 0){
                req.params.error = errors; // add array
            }
            if (e.message !== undefined) {
                req.params.error.push({msg: e.message});
            }
            return redirectToInstructorLogin(req,res);
        }
    }else {
        next();
    }

}

async function generateLink(req, res, next) {

    let currentInstructor = instructorObj.id ? instructorObj.id : req.body.instructorObject.id;
    let query =" SELECT * FROM emojidatabase.registrations where users_id ='" + currentInstructor +"'";

    try {
        const [rows, fields] = await db.execute(query);
        let numClasses = rows.length;
        let classesArray = rows;
        //4000 redirects to http://54.215.121.49:4000/EmojiSharing/?classId=
        //TODO write if statement for when rows is empty
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
        let errors = [];
        errors.push({msg: e.message})
        return res.render("instructorAccount.ejs" ,{
            instructorObject : {},
            newInstructor : instructorObj && instructorObj.fullName ? instructorObj.full_name : '',
            classes : [],
            classNames : [],
            path : path,
            alerts : errors
        });
    }
}

function redirectToInstructorLogin(req,res){
    let errors =[];
    let message = "Unable to proceed.";
    if (req.session.flash && req.session.flash.error.length > 0){
        message = req.session.flash.error[req.session.flash.error.length - 1] ; // getting the latest error message in this session
    }
    if (req.params.error.length>0){
        req.params.error.forEach( each => {
            errors.push( {msg: each.msg})
        })
        if (message.length >0){
            errors.push( {msg: message})
        }
        return res.render("instructorLogin",{
            errors: errors
        });
    }

    return res.render("instructorLogin",{
        message: message
    });
}
async function postLogOut (req, res) {
    req.session.destroy(function(err) {
        res.render("instructorLogin",{
            message: "You have been logged out."
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


