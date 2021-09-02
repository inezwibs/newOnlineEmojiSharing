const db = require("../configs/database.js");
const emojiController = require("../controllers/emojiController");

class ParsingServices {
    _result = {};
    constructor() {

    }

    getIdsFromUrl(urlPath) {
        const re = /\d+/g;
        let found =  urlPath.match(re);
        return found;
    }

    getClassLinks(url) {
        let numbersInUrl = this.getIdsFromUrl(url);
        let classId, classLinkId;
        numbersInUrl = numbersInUrl.filter(notPort => notPort !== '4000'); // will return query params that are not the 4000 port
        if (numbersInUrl && numbersInUrl.length === 2) {
            return {classLinkId:numbersInUrl[0], classId : numbersInUrl[1]};
        } else {
            return {};
        }
    }
}
module.exports = ParsingServices;
