const db = require("../configs/database.js");

class ParsingServices {
    _result = {};
    constructor() {

    }

    getIdsFromUrl(urlPath) {
        const re = /\d+/g;
        let found =  urlPath.match(re);
        return found;
    }}

module.exports = ParsingServices;
