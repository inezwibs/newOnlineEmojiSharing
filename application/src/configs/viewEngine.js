const express = require("express");
const path = require('path');

/**
 * Config view engine for app
 */
let configViewEngine = (app)=> {
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'ejs');
    const publicDirectory = path.join(__dirname, '../../public');
    app.use(express.static(publicDirectory));
};

module.exports = configViewEngine;
