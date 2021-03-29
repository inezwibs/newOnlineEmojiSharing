const express = require('express');
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
var passport = require("passport");
var expressValidator = require("express-validator");
const initWebRoutes = require( "./src/routes/web");
const connectFlash = require( "connect-flash");
const bodyParser = require("body-parser");
const configViewEngine = require("./src/configs/viewEngine");


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

// allows to parse body in http post requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(bodyParser.json());

// config express session
app.use(
    session({
      secret: "CSC Class",
      saveUninitialized: false,
      store: sessionStore,
      resave: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // 86400000 1 day
        }
    })
  );

//Config view engine
configViewEngine(app);

//Enable flash message
app.use(connectFlash());

//Config passport middleware
app.use(passport.initialize());
app.use(passport.session());

const generalRoutes = require("./src/routes/generalRoutes");
// const historyRouter = require("./src/controllers/historyController");
app.use("/", generalRoutes);
// app.use("/", historyRouter);

//Init all web routes
initWebRoutes(app);

app.listen(PORT, () => console.log("server started on port", PORT));
