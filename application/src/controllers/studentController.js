const db = require("../configs/database.js");
const {url} = require("url");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
let path = 'http://emotionthermometer.online:4000/EmojiSharing?classLinkId=';
let localPath = 'http://localhost:4000/EmojiSharing?classLinkId=';
const emojiController = require("../controllers/emojiController");
let classIdValue;
let classLinkIdValue;


async function getClassLinkPage (req, res, next) {
    res.render("classLinkPage");
}

async function listClassLinks (req,res,user) {
    let classIdQuery = "SELECT c.class_name, c.datetime, r.id, r.classes_id " +
        "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
        "WHERE u.id = r.users_id " +
        "AND c.id = r.classes_id AND r.classes_id = " + req.body.classId + " AND r.isInstructor = \'1\' ";
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
  let query =
    " SELECT * FROM emojidatabase.users where email = '" + req.body.email + "'";

  try {
    const [res, err] = await db.execute(query);
    let userIsValid;
    let errorMsg;
    if (res.length > 0) {
      userIsValid = 0;
      errorMsg = "the user exists";
    } else {
      userIsValid = 1;
    }
    req.userIsValid = userIsValid;
    req.errorMsg = errorMsg;
    req.class_id = classIdValue;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getUserId(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.users where email = '" + req.body.email + "'";

  try {
    const [res, err] = await db.execute(query);
    req.user_id = res[0].id;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function checkRegistration(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.registrations where id = " +
    req.class_id +
    " and users_id = " +
    req.user_id;
  try {
    const [res, err] = await db.execute(query);
    // console.log(query);
    let duplicateregistration;
    if (res.length > 0) {
      duplicateregistration = 1;
    } else {
      duplicateregistration = 0;
    }
    req.duplicateregistration = duplicateregistration;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function insertRegistration(req, res, next) {
  if (req.duplicateregistration === 0) {
    let query =
      " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
      req.class_id +
      " ," +
      req.user_id +
      " , 0 )";
     try {
      const [res, err] = await db.execute(query);
      // console.log(query);
      let duplicateregistration;
      if (res.length > 0) {
        duplicateregistration = 1;
      } else {
        duplicateregistration = 0;
      }
      req.duplicateregistration = duplicateregistration;
      next();
    } catch (e) {
      console.log("Catch an error: ", e);
    }
  } else {
    next();
  }
}

async function getStudentLoginPage(req,res) {

    return res.render("login", {
        title: "Login",
        classId: req.query.classId,
        classLinkId: req.query.classLinkId,
        isLoggedIn: req.isAuthenticated(),
  });
}

async function insertUser(req, res, next) {
  if (req.userIsValid === 1) {
    const hash = bcrypt.hashSync(req.body.password, saltRounds);
    let query =
      " INSERT INTO emojidatabase.users (full_name, email, password, isInstructor) VALUES ( '" +
      req.body.username +
      "' , '" +
      req.body.email +
      "' , '" +
      hash +
      "', 0)";

    try {
      await db.execute(query);
      next();
    } catch (e) {
      console.log("Catch an error: ", e);
    }
  } else {
    next();
  }
}

async function getRegistrationId(req, res, next) {
    let query =
        " SELECT * FROM emojidatabase.registrations where classes_id = " +
        req.class_id +
        " and users_id = " +
        req.user_id;

    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        req.reg_id = res[0].id;
        req.classLinkId = classLinkIdValue;
        req.classId = classIdValue;
        console.log('Reg Id',req.reg_id)
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

module.exports = {
    getStudentLoginPage: getStudentLoginPage,
    getRegistrationId: getRegistrationId,
    getStudentRegisterPage: getStudentRegisterPage,
    checkUserIsValid:checkUserIsValid,
    insertUser:insertUser,
    getUserId:getUserId,
    checkRegistration:checkRegistration,
    insertRegistration:insertRegistration,
    getClassLinkPage:getClassLinkPage,
    listClassLinks:listClassLinks
}

