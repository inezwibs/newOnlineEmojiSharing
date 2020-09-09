const express = require('express');
const path = require('path');
// var expressValidator = require("express-validator");

const PORT = 3000;


const app = express();

// logs requests to the backend

// sets view engine for ejs
app.set('views', path.join(__dirname, './src/views'));
app.set('view engine', 'ejs');

// allows to parse body in http post requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(expressValidator());

app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(PORT, () => console.log("server started on port", PORT));