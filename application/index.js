const express = require('express');
let session = require("express-session");
let MySQLStore = require("express-mysql-session")(session);
let passport = require("passport");
let expressValidator = require("express-validator");
const initWebRoutes = require( "./src/routes/web");
const connectFlash = require( "connect-flash");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const configViewEngine = require("./src/configs/viewEngine");
let passportSocketIo = require('passport.socketio')
const fs = require('fs')
let favicon = require('serve-favicon')
let path = require('path')


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

let sessionStore = new MySQLStore(options);
let app = express();
const http = require('http').createServer(app);
let io = require('socket.io')(http);

//handle get favicon/ico 404
app.use(favicon(path.join(__dirname, '/public/icon', 'favicon.ico')))
// logs requests to the backend
const morgan = require("morgan");
// app.use(morgan("tiny"));
const moment = require("moment-timezone");
morgan.token('date', (req, res, tz) => {
    return moment().tz(tz).format('YYYY-MM-DD, HH:mm a');
})
morgan.format("dev-plus-time","[:date[America/Los_Angeles]] :method :url :status :response-time ms - :res[content-length]");
app.use(morgan("dev-plus-time",{
    stream: fs.createWriteStream('./morgan.log',{flags: 'a'})
}));
app.use(morgan("dev-plus-time"));


// allows to parse body in http post requests
app.use(expressValidator());
app.use(bodyParser.json());

//Config view engine
configViewEngine(app);

// config express session
const sessionMiddleware = session({
    secret: "emoji-session",
    saveUninitialized: false, // won't save session when user have not logged in , and just visited
    store: sessionStore,
    resave: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 86400000 1 day
    },
    key: 'express.sid'
});
app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
//Config passport middleware
app.use(passport.initialize());
app.use(passport.session());

io.use(
    passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: "emoji-session",
        store: sessionStore,
        success: onAuthorizeSuccess,
        fail: onAuthorizeFail
    })
);

let uniqueUsers = 0;
let userSet = new Set();
io.on('connection', (socket) => {

    console.log('Socket info: ', socket.id);
    console.log('Socket info: ', socket.request.user);
    // userSet.add({socket.request.user.user[0].id : socket.request.user.user[0]});
    // let newUser = {socketId: socket.id, socketUserCount: socket.request.user.user.length};
    // console.log(newUser);
    if (socket.request.user.user && socket.request.user.user.length > 0){
        userSet.add(socket.request.user.user[0].id);
        socket.userId = socket.request.user.user[0].id;
    }
    // let emitDataObj = {
    //     user: [...userSet],
    //     body: socket.request.user.body,
    // }
    io.emit('user', [...userSet])
    uniqueUsers = userSet.size;
    io.emit('userCount',uniqueUsers);
    console.log('A user has connected. Current unique user count: ', uniqueUsers);
    socket.on('user data', data => {
        console.log('user data',data);
        module.exports.userOnlineData = data;
    });

    socket.on('disconnect', (reason) => {
        console.log('A user has disconnected, reason : ', reason);
        if (socket.userId){
            userSet.delete(socket.userId);
            io.emit('user disconnected', socket.userId);
        }
        uniqueUsers = userSet.size;
        io.emit('userCount',uniqueUsers);
        io.emit('user', [...userSet])
        console.log('A user has disconnected. Current unique user count: ', uniqueUsers);
        socket.on('user data', data => {
            console.log('user data',data);
            module.exports.userOnlineData = data;
        });
    });
});
//Enable flash message
app.use(connectFlash());


function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');

    accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
    if (error) throw new Error(message);
    console.log('failed connection to socket.io:', message);
    accept(null, false);
}

//Init all web routes
const generalRoutes = require("./src/routes/generalRoutes");
app.use("/", generalRoutes);
initWebRoutes(app);

app.use((req, res, next) => {
    res.status(404).send({
        status: 404,
        error: "Not found"
    });

});

// error handler middleware
// interface Error {
//     status?: number;
//     message?: string;
// }
// app.use((error:Error, res, next) => {
//     console.error(error.stack);
//     res.status(error.status || 500);
//     res.render("errorPage",{
//         alerts: error.stack
//     });
// })
http.listen(PORT, () => console.log("server started on port", PORT));



