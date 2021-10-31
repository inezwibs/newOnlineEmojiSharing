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

    getToken(){
        let seed = '123456789abcdefghijklmnopqrstuvwxyz';
        let resultToken ='';
        for (let i = 10; i > 0 ; i--){
            resultToken += seed[Math.floor(Math.random() * 10)];
        }
        return resultToken;
    }
}
module.exports = ParsingServices;
