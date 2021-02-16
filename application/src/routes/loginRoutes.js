/*
Author: Raya Farshad
Description: API for user registration, Login, Logout and authentication.
*/

const express = require("express");
const router = express.Router();
const { User } = require("../configs/user.js"); //User model not being used
const passport = require("passport");
const db = require("../configs/database.js");
const bcrypt = require("bcryptjs");
const url = require("url");
const saltRounds = 10;

// Gets student registration page
router.get("/register", function (req, res, next) {
  // console.log("raya_query: " + req.query.classID);
  res.render("register", {
    title: "Form Validation",
    classID: req.query.classID,
  });
  req.session.errors = null;
});


//first check if same classes_id && users_id is not exists then insert
async function insertToRegistration(req, res, next) {
  let query =
    " INSERT INTO emojidatabase.registrations (classes_id, users_id) VALUES ( " +
    req.body.classID +
    ", " +
    req.userID +
    " )";
  // await db.execute(query, (err, res) => {
  //   console.log("myQuery: "+query);
  //     if (err) throw err;
  //     next();
  // });
  try {
    await db.execute(query);
    // console.log(query);
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}
async function getUserID(req, res, next) {
  let query =
    " SELECT * FROM emojidatabase.users where email = '" + req.body.email + "'";
  // await db.execute(query, (err, res) => {
  //     console.log(query);
  //     if (err) throw err;

  //     req.userID = res[0].id;
  //     console.log(req.userID);
  //     next();
  // });
  try {
    const [res, err] = await db.execute(query);
    req.userID = res[0].id;
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}
//check user is user is valid, no email like that is exists-> userValid = true/false
//if userValid == false -> pass error message to req.errorMessage
//if userValid ==true -> (add user to users table) (get the user number) (get classID) (add to registration)
// Verifies that new user has filled in the signup form correctly and creates user
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

async function getUserID(req, res, next) {
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
async function checkregistration(req, res, next) {
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

async function insertregistration(req, res, next) {
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

async function getregistrationID(req, res, next) {
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

router.post(
  "/register",
  checkUserIsValid,
  insertUser,
  getUserID,
  checkregistration,
  insertregistration,
  getregistrationID,
  function (req, res, next) {
    // console.log("req.userIsValid: "+req.userIsValid);
    // console.log("req.errorMsg: "+req.errorMsg);
    // console.log("req.class_id: "+req.class_id);
    // console.log("req.user_id: "+req.user_id);
    req.login({ id: req.user_id }, () =>
      res.redirect(
        url.format({
          pathname: "/sendEmoji",
          query: {
            reg_id: req.reg_id,
          },
        })
      )
    );
  }
);

//if login failed remove the Registrations added row
// Redirect for failed login
router.get("/login/failed", (req, res) => {
  // console.log('login failed');
  res.render("login", {
    error_msg: "login failed",
    isLoggedIn: req.isAuthenticated(),
  });
});

// Get login page
router.get("/login", function (req, res) {
  res.render("login", {
    error_msg: "",
    title: "Login",
    classID: req.query.classID,
    isLoggedIn: req.isAuthenticated(),
  });
});

// // Logs in user
// router.post("/login",
//   passport.authenticate("local", {
//     successRedirect: "/sendEmoji",
//     failureRedirect: "/login/failed",
//     failureFlash: false
//   })
// );

async function getRegistrationID_login(req, res, next) {
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
    next();
  } catch (e) {
    console.log("Catch an error: ", e);
  }
}

// Logs in user
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
    failureFlash: false,
  }),
  getRegistrationID_login,
  function (req, res) {
    // console.log("req.user.id: "+req.user.id);
    // console.log("req.query.classID: "+req.body.classID);

    res.redirect(
      url.format({
        pathname: "/sendEmoji",
        query: {
          reg_id: req.reg_id,
        },
      })
    );
  }
);

// Logs out user
router.get("/logout", function (req, res) {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((id, done) => {
  done(null, id);
});

module.exports = router;
