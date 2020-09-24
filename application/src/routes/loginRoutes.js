/*
Author: Raya Farshad
Description: API for user registration, Login, Logout and authentication.
*/

const express = require("express");
const router = express.Router();
const { User } = require("../models/user.js");
const { validationResult } = require("express-validator/check");
const passport = require("passport");
var expressValidator = require("express-validator");
const db = require("../models/database.js");
var classID;

// Gets registration page
router.get("/register", function(req, res, next) {
  console.log("raya_query: " + req.query.classID);
  classID = req.query.classID;
  // console.log("10 : " + req.isAuthenticated());
  res.render("register", {
    title: "Form Validation"
    // errors: errors

  });
  req.session.errors = null;
});

async function registerFunc(req, res, next) {
  console.log("raya_query2: " + req.classID);

  req
    .check("username", "username must be between  6 and 18 character")
    .isLength({ min: 1, max: 25 }),
    req
      .check("email", "invalid email adress")
      .exists()
      .isEmail()
      // .contains("mail.sfsu.edu");
  req.check('email', 'Please enter your email');
  req
    .check("password", "password must be between  6 and 18 character")
    .isLength({ min: 6, max: 18 }),
    req.check('password', 'password not match').equals(req.body.passwordMatch);
  //   req.check("terms", "You must accept the terms and conditions.").equals("1");
  // req.check("privacy", "You must accept the privacy policy").equals("1");

  var errors = req.validationErrors();
  // const errors = validationResult(req).array({ onlyFirstError: true });
  if (errors) {
    // console.log(`errors: ${JSON.stringify(errors)}`);

    // res.json(JSON.stringify({ errors: errors }));
    // res.render("register", {
    //   title: "Registeration Error",
    //   errors: errors
    // });
  } else {
    const { username, email, password , passwordMatch} = req.body;
    // console.log("email is: " + req.body.email);
    // console.log("username is: " + req.body.username);
    User.checkValid(email).then(isValid => {
      //if there is no similar user in the the user table--> insert the user
      if (isValid) {
        console.log("valid");

        User.register(username, email, password).then(userID => {
          const user_id = userID;
          req.login({ id: userID }, () => res.render("emojiSharing"));
          console.log("goes here ..."+user_id);
          console.log("user register post: " + req.user.id);
          console.log("isAthenticated: "+req.isAuthenticated());
        });

        //if there is similar user exists in the table --> show error
      } else {
        console.log("not valid");
        res.send('<script>alert("Hello")</script>');
        res.render("register", {
          title: "Error : Similar user exists",
          // errors: errors
          // isLoggedIn: req.isAuthenticated()
        });
      }
    });
  }
  next();
}
async function checkIsInstructor(req, res, next) {

  let query = " Select * from emoji_db.users where id = "+req.user.id;
  await db.execute(query, (err, res) => {
    console.log("myQuery: "+query);
    req.isInstructor = res[0].isInstructor;
      if (err) throw err;
      next();
  });
}

//first check if same classes_id && users_id is not exists then insert
async function inner(req, res, next) {

  let query = " INSERT INTO emoji_db.registerations (classes_id, users_id, isInstructor) VALUES ( " +classID+ ", "+req.user.id+", "+req.isInstructor+" )";
  await db.execute(query, (err, res) => {
    console.log("myQuery: "+query);
      if (err) throw err;
      next();
  });
}

async function insertToRegisteration(req, res, next) {
  let query = " SELECT * FROM emoji_db.registerations where classes_id = "+classID+ " and users_id = "+req.user.id;
  // console.log("content");


  await db.execute(query, (err, res) => {
    console.log(query);
    console.log(res);
      if (res !== undefined) {
          inner(req, res, next)
      }
      if (err) throw err;
      next();
  });
}

// Verifies that new user has filled in the signup form correctly and creates user
router.post("/register", registerFunc, checkIsInstructor, insertToRegisteration, function(req, res, next) {
  classID = req.query.classID;
  // console.log("classID: "+classID);
  // console.log("class_id: "+req.body);
});

//if login failed remove the Registrations added row
// Redirect for failed login
router.get("/login/failed", (req, res) => {

  console.log('login failed');
  res.render("login", {
    error_msg : 'login failed',
    isLoggedIn: req.isAuthenticated()
  });
});

// Get login page
router.get("/login", function(req, res) {
  classID = req.query.classID;
  res.render("login", {
    error_msg :'',
    title: "Login",
    isLoggedIn: req.isAuthenticated()
  });

});


// Logs in user
router.post("/login",
  passport.authenticate("local", {
    successRedirect: "/emojiSharing",
    failureRedirect: "/login/failed",
    failureFlash: false
  })
);

// Logs out user
router.get("/logout", function(req, res) {
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