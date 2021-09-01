const db = require("../configs/database.js");
const {url} = require("url");
const re = /\d+/g;
let path = 'http://emotionthermometer.online/EmojiSharing?classLinkId=';
let localPath = 'http://localhost:4000/EmojiSharing?classLinkId=';
const emojiController = require("../controllers/emojiController");
const ParsingService = require("../services/parsingServices");
const parsingService = new ParsingService();
let classIdValue;
let classLinkIdValue;
const StudentServices = require( "../services/studentServices" );
const studentServices = new StudentServices();
const registerServices = require( "../services/registerServices" );


async function getClassLinkPage (req, res, next) {
    res.render("classLinkPage");
}
/*
 classLinkId : req.body.classLinkId,
        classObj: classObj,
        path : path
 */
async function getSignUpPage (req, res, next) {
    res.render("signUp");
}

async function listClassLinks (req,res,user) {
    let classIdQuery;
    if (req.body.classId){
        classIdQuery = "SELECT c.class_name, c.datetime, r.id, r.classes_id " +
            "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
            "WHERE u.id = r.users_id " +
            "AND c.id = r.classes_id AND r.classes_id = " + req.body.classId + " AND r.isInstructor = \'1\' ";
    }

    let classObj;
    try{
        const [rows, err ] = await db.execute(classIdQuery);
        if (rows === undefined || rows.length ===0) {
            console.log("Classes not found")
        }else{
            classObj = rows;
        }
    }catch(e){
        console.log('error' , e)
    }
    return res.render("classLinkPage.ejs" ,{
        classLinkId : req.body.classLinkId,
        classObj: classObj,
        path : path
    });
};

async function getStudentRegisterPage (req, res, next) {
    if (req.url && (req.url).match(re)) {

        classLinkIdValue = req.query.classLinkId && req.query.classLinkId.length < 5 ? req.query.classLinkId : emojiController.getIdsFromUrl(req.url)[0];
        classIdValue = req.query.classId ? req.query.classId : emojiController.getIdsFromUrl(req.url)[1]
        res.render("register", {
            title: "Form Validation",
            classId: classIdValue,
            classLinkId: classLinkIdValue,
            disabled: false
        });
        req.session.errors = null;
    } else if (req.user && req.user.success && req.user.body.classLinkId && req.user.body.classLinkId.match(re)){
        let result =  parsingService.getIdsFromUrl(req.user.body.classLinkId);
        if (result.length == 2){
            classLinkIdValue = result[0];
            classIdValue = result[1];
        }else if (result.length < 2 && req.user.body.classLinkId.length >0 && req.user.body.classId.length > 0 ){
            classLinkIdValue = req.user.body.classLinkId;
            classIdValue = req.user.body.classId;
        }
        let rowsObj = await studentServices.getEmojiClassData (req.user.user[0].id, classLinkIdValue, classIdValue )

        res.render("emojiSharing", {
            alerts: req.user.message,
            classLinkId: classLinkIdValue,
            regId : classLinkIdValue,
            classId: classIdValue,//id shows undefined?
            userId: req.user.user[0].id,
            userObj: rowsObj,
            emojiSelected: '3',
            isAnonymousStatus: req.body.isAnonymous === "on" ? true : false,
            path:path
        });
    }else if (req.user && !req.user.success && req.user.body.classLinkId && req.user.body.classLinkId.match(re)){
        let result =  parsingService.getIdsFromUrl(req.user.body.classLinkId);
        if (result.length == 2){
            classLinkIdValue = result[0];
            classIdValue = result[1];
        }else if (result.length < 2 && req.user.body.classLinkId.length >0 && req.user.body.classId.length > 0 ){
            classLinkIdValue = req.user.body.classLinkId;
            classIdValue = req.user.body.classId;
        }

        res.render("register", {
            title: "Form Validation",
            classId: classIdValue,
            classLinkId: classLinkIdValue,
            alerts: req.user.message,
            disabled: false
        });
        req.session.errors = null;
    }else{
        if (req.headers.referer && (req.headers.referer).match(re)?.length > 2){
            let ids= parsingService.getIdsFromUrl(req.headers.referer);
            ids = ids.filter(notPort => notPort !== '4000'); // will return query params that are not the 4000 port
            if (ids && ids.length === 2) {
                req.classLinkId = ids[0];
                req.classId = ids[1];
                if (req.session.flash.error.length >0){
                    res.render("login", {
                        title: "Form Validation",
                        classId: req.classId,
                        classLinkId: req.classLinkId,
                        isLoggedIn: req.isAuthenticated(),
                        alerts: req.session.flash.error[req.session.flash.error.length - 1 ]
                    });
                }else{
                    res.render("login", {
                        title: "Form Validation",
                        classId: req.classId,
                        classLinkId: req.classLinkId,
                        isLoggedIn: req.isAuthenticated(),
                        alerts: `This user is not yet registered for this class. Use links below to register for class id = ${req.classId} or look up your class id.`
                    });
                }
            }
        }
        else{
            res.render("register", {
                title: "Form Validation",
                classId: req.classId,
                classLinkId: req.classLinkId,
                isLoggedIn: req.isAuthenticated(),
                alerts: `Failed to login. Please register using links below or look up your class id to register.`
            });
        }
    }
}

async function checkIfUserExists(req,res,next){
    let rows;
    try {
        rows = await studentServices.doesUserExist(req.body);
        if (rows.success && rows.body.length === 0) {
            //user doesn't exist at all TESTED
            res.render("register", {
                alerts: rows.message,
                title: "Form Validation",
                classId: classIdValue,
                classLinkId: classLinkIdValue,
                disabled: true
            })
        }else if (rows.success && rows.body.length > 0) {
            //user exists
            //TODO testing in progress
            req.doesUserExist = true;
            next();
        }
    }catch (e) {
        //error caught
        res.render("register", {
            alerts: rows.error,
            title: "Form Validation",
            classId: classIdValue,
            classLinkId: classLinkIdValue,
            disabled: true
        })
    }
}

async function checkUserIsValid(req, res, next) {
    let errors = [];
    //come here from signUp or from register post calls
    req.doesUserExist = req.doesUserExist ? req.doesUserExist: false;
    //guard
    if (!classIdValue){
        let classIdResult = studentServices.getClassDetailsFromReq(req.body, req.headers);
        if (Object.keys(classIdResult).length === 0){
            errors.push({msg: "Failed to register. Please look up your unique class link to register."})
            return res.render('register', {
                errors: errors,
                title: "Form Validation",
                classId: classIdValue ? classIdValue: 'not_found',
                classLinkId: classLinkIdValue ? classLinkIdValue: 'not_found',
                disabled: false
            })
        }else{
            classIdValue = classIdResult;
        }
    }
    try {
        //main query passing req.body containing doesUserExist

        let rows = await studentServices.checkExistingClassRegistration(req.body, classLinkIdValue, classIdValue, req.doesUserExist);
        let isEmpty = studentServices.isEmptyObject(rows.body);
        // if user does not exist at all
        if (rows.success && isEmpty && !rows.isRegistered){
            // let insertUserResult = await studentServices.insertUser(req.body);
            if (rows.success){
                req.user_id = rows.body.body.insertId;
                res.render('login', {
                    alerts: rows.message,
                    title: "Form Validation",
                    classId: classIdValue,
                    classLinkId: classLinkIdValue
                })
            }
        // if user exist but maybe or maybe not for this class
        } else if (rows.success && !isEmpty && rows.isRegistered) {
            req.classLinkId = classLinkIdValue ? classLinkIdValue : req.body.classLinkId;
            req.classId = classIdValue ? classIdValue : req.body.classId;
            // req.user_id = rows.body.id;
            // req.user_details = rows.body;
            // let insertRegResult = await studentServices.insertRegistration(req.body, req.user_id, classIdValue);
            // if user existed for this class
            if (rows.success && rows.body.id) {
                // if user is registered already for this class
                req.reg_id = rows.body.id;
                console.log('Reg Id', req.reg_id)
                // if user is not registered already for this class and was just registered
            } else if (rows.success && rows.body.insertId) {
                // if user is already registered and attempts to register again
                req.reg_id = rows.body.insertId;
                console.log('Reg Id', req.reg_id)
            }

            return res.render("login", {
                title: "Login",
                classId: classIdValue,
                classLinkId: classLinkIdValue,
                isLoggedIn: req.isAuthenticated(),
                alerts: rows.message
            });
        } else if (rows.error) {
            let errorMessage = "";
            if (rows.error[0].msg.errno === 1054) {
                errorMessage = "We are having trouble completing registration. Please try a new browser window and start a new page."
            }

            errors.push({msg: errorMessage})

        } else if (!rows.success) {
            let errorMessage = "";

            errors.push({msg: rows.message})
            res.render('register', {
                errors: errors,
                title: "Form Validation",
                classId: classIdValue ? classIdValue: 'not_found',
                classLinkId: classLinkIdValue ? classLinkIdValue: 'not_found',
                disabled: false
            })
        }
        // next(); // go to getSendEmoji
    } catch (e) {
        console.log("Catch an error: ", e);
        errors.push({msg: e});
        if (errors.length > 0){
            res.render('register', {
                errors: errors,
                title: "Form Validation",
                classId: classIdValue,
                classLinkId: classLinkIdValue,
                disabled: false
            })
        }
    }
}


async function insertRegistration(req, res, next) {
    let errors = [];
    let query =
      " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
      classIdValue +
      " ," +
      req.user_id +
      " , 0 )";
     try {
         const [res, err] = await db.execute(query);
         req.reg_id = res.insertId;
         req.classLinkId = classLinkIdValue;
         req.classId = classIdValue;
         console.log('Reg Id', req.reg_id)
         next();
     } catch (e) {
         console.log("Catch an error: ", e);
         errors.push({msg: e})
         res.render('register', {
             errors: errors,
             title: "Form Validation",
             classId: classIdValue,
             classLinkId: classLinkIdValue
         })
     }
}

async function getStudentLoginPage(req,res) {

    console.log("Session from get student login page**", req.session);
    let classLinkIdValue = req.query.classLinkId ? req.query.classLinkId : '';
    let classIdValue = req.query.classId ? req.query.classId : '';//id shows undefined?
    let isAuthenticated = req.isAuthenticated();
    let errors = [];
    if (isAuthenticated){
        let userObj = req.session.passport.user.user[0];
        let emojiValue = req.body.optradio ? req.body.optradio  : '';

        let rowsObj = await studentServices.getEmojiClassData (userObj.id, classLinkIdValue, classIdValue )

        if (rowsObj){
            
            full_name = "";
            date_time =  "";

        }else{
            let message= 'You are not registered for this class. Please register or look up your class link to register for a different class.';
            let classObj;
            errors.push({msg: message})
            return res.render('register', {
                errors: errors,
                title: "Form Validation",
                classId: classIdValue,
                classLinkId: classLinkIdValue,
                disabled: false
            })
            // return res.render("classLinkPage", {
            //     classObj: classObj ? classObj : {},
            //     path : path,
            //     message: message
            // });
        }
        return res.render("emojiSharing", {
            classLinkId: classLinkIdValue,
            regId : classIdValue,
            classId: classIdValue,//id shows undefined?
            userId: userObj.id,
            userObj: rowsObj,
            emojiSelected: emojiValue.length == 0 ? "3" : emojiValue,
            isAnonymousStatus: false,
            path:path
        });

    }else{
        return res.render("login", {
            title: "Login",
            classId: classIdValue,
            classLinkId: classLinkIdValue,
            isLoggedIn: isAuthenticated,
            alerts: []
        });
    }
}

module.exports = {
    getStudentLoginPage: getStudentLoginPage,
    getStudentRegisterPage: getStudentRegisterPage,
    checkUserIsValid:checkUserIsValid,
    insertRegistration:insertRegistration,
    checkIfUserExists:checkIfUserExists,
    getClassLinkPage:getClassLinkPage,
    listClassLinks:listClassLinks
}

