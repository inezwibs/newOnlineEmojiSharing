const db = require("../configs/database.js");
const {url} = require("url");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
let path = 'http://emotionthermometer.online:4000/EmojiSharing?classID=';
let localPath = 'http://localhost:4000/EmojiSharing?classID=';



async function getClassLinkPage (req, res, next) {
    res.render("classLinkPage");
}

async function listClassLinks (req,res,user) {
    // let classIdQuery = " SELECT classes_id FROM emojidatabase.registrations where id = '"+ req.body.classId + "'" ;
    // let classObj;
    // try{
    //     const [rows, err ] = await db.execute(classIdQuery);
    //     if (rows === undefined || rows.length ===0) {
    //         throw ErrorEvent("ER_KEY_NOT_FOUND")
    //     }else{
    //         classObj = rows[0];
    //     }
    // }catch(e){
    //     console.log('error' , e)
    // }
    return res.render("generateLink.ejs" ,{
        classId : req.body.classId,
        path : localPath
    });
};

async function getStudentRegisterPage (req, res, next) {
  // console.log("raya_query: " + req.query.classID);
  res.render("register", {
    title: "Form Validation",
    classID: req.query.classID,
  });
  req.session.errors = null;
}

async function checkUserIsValid(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.users where email = '" + req.body.email + "'";
  // await db.execute(query, (err, res) => {
  //     console.log(query);
  //     if (err) throw err;
  //     let userIsValid;
  //     let errorMsg;
  //     if(res.length > 0){
  //       console.log("res.length > 0");
  //       userIsValid = 0;
  //       errorMsg = 'the user exists';
  //     }else{
  //       console.log("res.length == 0");
  //       userIsValid = 1;
  //     }
  //     req.userIsValid = userIsValid;
  //     req.errorMsg = errorMsg;
  //     req.class_id = req.body.classID;
  //     next();
  // });
  try {
    const [res, err] = await db.execute(query);
    let userIsValid;
    let errorMsg;
    if (res.length > 0) {
      // console.log("res.length > 0");
      userIsValid = 0;
      errorMsg = "the user exists";
    } else {
      // console.log("res.length == 0");
      userIsValid = 1;
    }
    req.userIsValid = userIsValid;
    req.errorMsg = errorMsg;
    req.class_id = req.body.classID;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getUserId(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.users where email = '" + req.body.email + "'";
  // await db.execute(query, (err, res) => {
  //     console.log(query);
  //     if (err) throw err;
  //     req.user_id = res[0].id;
  //     next();
  // });
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
    " SELECT * FROM emojidatabase.registrations where classes_id = " +
    req.class_id +
    " and users_id = " +
    req.user_id;
  // await db.execute(query, (err, res) => {
  //     console.log(query);
  //     if (err) throw err;
  //     let duplicateregistration;
  //     if(res.length > 0){
  //       duplicateregistration = 1;
  //     }else{
  //       duplicateregistration = 0;
  //     }
  //     req.duplicateregistration = duplicateregistration;
  //     next();
  // });
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
    // await db.execute(query, (err, res) => {
    //     console.log(query);
    //     if (err) throw err;
    //     let duplicateregistration;
    //     if(res.length > 0){
    //       duplicateregistration = 1;
    //     }else{
    //       duplicateregistration = 0;
    //     }
    //     req.duplicateregistration = duplicateregistration;
    //     next();
    // });
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
async function getRegistrationId(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.registrations where classes_id = " +
    req.class_id +
    " and users_id = " +
    req.user_id;
  // await db.execute(query, (err, res) => {
  //     console.log(query);
  //     if (err) throw err;
  //     req.reg_id = res[0].id;
  //     next();
  // });
  try {
    const [res, err] = await db.execute(query);
    // console.log(query);
    req.reg_id = res[0].id;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

async function getStudentLoginPage(req,res) {

    return res.render("login", {
    title: "Login",
    classID: req.query.classID,
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
    // await db.execute(query, (err, res) => {
    //     console.log(query);
    //     if (err) throw err;
    //     next();
    // });
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
        req.body.classID +
        " and users_id = " +
        req.user.id;
    // await db.execute(query, (err, res) => {
    //     console.log(query);
    //     if (err) throw err;
    //     req.reg_id = res[0].id;
    //     next();
    // });
    try {
        const [res, err] = await db.execute(query);
        // console.log(query);
        req.reg_id = res[0].id;
        console.log('Reg Id',req.reg_id)
        next();
    } catch (e) {
        console.log("Catch an error: ", e);
    }
}

async function redirectToSendEmoji(req, res, next) {
        return res.redirect(url.format({
          pathname: "/sendEmoji",
          query: {
            reg_id: req.reg_id,
          },
        })
        );
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
    redirectToSendEmoji:redirectToSendEmoji,
    getClassLinkPage:getClassLinkPage,
    listClassLinks:listClassLinks
}

// router.post(
//   "/register",
//   checkUserIsValid,
//   insertUser,
//   getUserID,
//   checkregistration,
//   insertregistration,
//   getregistrationID,
//   function (req, res, next) {
//     // console.log("req.userIsValid: "+req.userIsValid);
//     // console.log("req.errorMsg: "+req.errorMsg);
//     // console.log("req.class_id: "+req.class_id);
//     // console.log("req.user_id: "+req.user_id);
//     req.login({ id: req.user_id }, () =>
//       res.redirect(
//         url.format({
//           pathname: "/sendEmoji",
//           query: {
//             reg_id: req.reg_id,
//           },
//         })
//       )
//     );
//   }
// );
//