const express = require('express');
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
var passport = require("passport");
var jwt = require('jsonwebtoken');
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
    checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
    expiration: 1512671400000,// The maximum age of a valid session; milliseconds.
    createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
    connectionLimit: 10,// Number of connections when creating a connection pool
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
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

//Config view engine
configViewEngine(app);

// config express session
app.use(
    session({
        secret: "emoji-session",
        saveUninitialized: false, // won't save session when user have not logged in , and just visited
        store: sessionStore,
        resave: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // 86400000 1 day
        }
    })
);

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
