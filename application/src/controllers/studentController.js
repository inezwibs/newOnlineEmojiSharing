const db = require("../configs/database.js");
const {url} = require("url");

let path = 'http://emotionthermometer.online:4000/EmojiSharing?classLinkId=';
let localPath = 'http://localhost:4000/EmojiSharing?classLinkId=';
const emojiController = require("../controllers/emojiController");
let classIdValue;
let classLinkIdValue;
const StudentServices = require( "../services/studentServices" );
const studentServices = new StudentServices();


async function getClassLinkPage (req, res, next) {
    res.render("classLinkPage");
}

async function listClassLinks (req,res,user) {
    let classIdQuery;
    if (req.body.classId){
        classIdQuery = "SELECT c.class_name, c.datetime, r.id, r.classes_id " +
            "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
            "WHERE u.id = r.users_id " +
            "AND c.id = r.classes_id AND r.classes_id = " + req.body.classId + " AND r.isInstructor = \'1\' ";
    }
    // else if (req.body.email){
    //     classIdQuery = "SELECT c.class_name, c.datetime, r.id, r.classes_id " +
    //         "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
    //         "WHERE u.id = r.users_id " +
    //         "AND c.id = r.classes_id AND u.email = " + req.body.email + " AND r.isInstructor = \'1\' ";
    // }

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
   classLinkIdValue = req.query.classLinkId && req.query.classLinkId.length < 5 ? req.query.classLinkId: emojiController.getIdsFromUrl(req.url)[0];
   classIdValue = req.query.classId ? req.query.classId : emojiController.getIdsFromUrl(req.url)[1]
  res.render("register", {
    title: "Form Validation",
    classId: classIdValue,
    classLinkId: classLinkIdValue
  });
  req.session.errors = null;
}

async function checkUserIsValid(req, res, next) {
    let errors = [];
    let userIsValid = 0;

    try {
        let rows = await studentServices.checkExistingClassRegistration(req.body);
        let isEmpty = studentServices.isEmptyObject(rows.body);
        // if user does not exist at all
        if (rows.success && isEmpty && !rows.isRegistered){
            let insertUserResult = await studentServices.insertUser(req.body);
            if (insertUserResult.success){
                req.user_id = insertUserResult.body.insertId;
            }
            // if user exist but not registered for this class
            // user the same email and password
            // give them link to login page with class id and class link id
        }else if (rows.success && !isEmpty && !rows.isRegistered){
            req.user_id = rows.body.id;
            req.user_details = rows.body;
            let insertRegResult = await studentServices.insertRegistration(req.body, req.user_id, classIdValue);
            if (insertRegResult.success){
                req.reg_id = insertRegResult.body.insertId;
                req.classLinkId = classLinkIdValue;
                req.classId = classIdValue;
                console.log('Reg Id', req.reg_id)
                return res.render("login", {
                    title: "Login",
                    classId: classLinkIdValue,
                    classLinkId: classIdValue,
                    isLoggedIn: req.isAuthenticated(),
                    alerts: rows.message
                });
            }else if (insertRegResult.body === 1){
                req.reg_id = insertRegResult.body.insertId;
                req.classLinkId = classLinkIdValue;
                req.classId = classIdValue;
                console.log('Reg Id', req.reg_id)
                return res.render("login", {
                    title: "Login",
                    classId: classLinkIdValue,
                    classLinkId: classIdValue,
                    isLoggedIn: req.isAuthenticated(),
                    errors: insertRegResult.error
                });
            } else {
                let errorMessage = "";
                if (insertRegResult.error){
                    if (insertRegResult.error[0].msg.errno === 1054){
                        errorMessage = "We are having trouble completing registration. Please try a new browser window and start a new page."
                    }
                }
                errors.push({msg: errorMessage})
            }
            // if user exist and registered for this class
        }else if (rows.isRegistered) {
            //rows.success is false
            req.reg_id = rows.body.insertId;
            req.classLinkId = classLinkIdValue;
            req.classId = classIdValue;
            console.log('Reg Id', req.reg_id)
            return res.render("login", {
                title: "Login",
                classId: classLinkIdValue,
                classLinkId: classIdValue,
                isLoggedIn: req.isAuthenticated(),
                alerts: rows.message
            });
        }
        // check for errors
        if (errors.length > 0){
            res.render('register', {
                errors: errors,
                title: "Form Validation",
                classId: classIdValue,
                classLinkId: classLinkIdValue
            })
        }else{
            next()
        }
    } catch (e) {
        console.log("Catch an error: ", e);
        errors.push({msg: e})
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
    return res.render("login", {
        title: "Login",
        classId: req.query.classId,
        classLinkId: req.query.classLinkId,
        isLoggedIn: req.isAuthenticated(),
        alerts: []
    });
}

module.exports = {
    getStudentLoginPage: getStudentLoginPage,
    getStudentRegisterPage: getStudentRegisterPage,
    checkUserIsValid:checkUserIsValid,
    insertRegistration:insertRegistration,
    getClassLinkPage:getClassLinkPage,
    listClassLinks:listClassLinks
}

