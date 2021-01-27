const express = require('express');
const path = require('path');
const { User } = require("./src/models/user.js");
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var expressValidator = require("express-validator");



const PORT = 4000;

var options = {
    database: "emojidatabase",
    user: "publicadmin",
    port:"3307",
    password: "1600holloway",
    host: "127.0.0.1",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
    };

var sessionStore = new MySQLStore(options);
const app = express();



// logs requests to the backend
const morgan = require("morgan");
app.use(morgan("tiny"));

// sets view engine for ejs
app.set('views', path.join(__dirname, './src/views'));
app.set('view engine', 'ejs');
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

// allows to parse body in http post requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(expressValidator());
app.use(express.static("./public"));
app.use(expressValidator());
app.use(bodyParser.json());

// use express session
app.use(
    session({
      secret: "CSC Class",
      saveUninitialized: false,
      store: sessionStore,
      resave: false
    })
  );

app.use(passport.initialize());var mysql = require('mysql');
app.use(passport.session());


const loginRouter = require("./src/routes/loginRoutes");
const InstructorHomeRoutes = require("./src/routes/InstructorHomeRoutes");
const generalRoutes = require("./src/routes/generalRoutes");
const sendEmojis = require("./src/routes/sendEmojiRoutes");
const historyRouter = require("./src/routes/historyRoutes");
app.use("/", InstructorHomeRoutes);
app.use("/", generalRoutes);
app.use("/", loginRouter);
app.use("/", sendEmojis);
app.use("/", historyRouter);



passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      function(email, password, done) {
        const isValid = User.findUser(email, password);
        console.log("isvalid? "+isValid);
        console.log('email is: '+email);
        console.log('password is: '+password);


        isValid.then(res => {
          if (res != false) {
            return done(null, res);
          }

  
          return done(null, false, { message: "Invalid email or password." });
        });
      }
    )
  );
app.listen(PORT, () => console.log("server started on port", PORT));
