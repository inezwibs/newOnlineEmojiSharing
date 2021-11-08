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

    getLetters(entry) {
        const re = /[a-zA-Z]+/g;
        let isFound =  entry.match(re);
        return isFound;
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

    processDaysOnly(resultArr){
        let daysOnly=[];
        resultArr.forEach( result => {
            if (this.getLetters(result)){
                daysOnly.push(result);
            }
        })
        return daysOnly;
    }

    getToken(){
        let seed = '123456789abcdefghijklmnopqrstuvwxyz';
        let resultToken ='';
        for (let i = 10; i > 0 ; i--){
            resultToken += seed[Math.floor(Math.random() * 10)];
        }
        return resultToken;
    }

    setRefreshInterval (isThreeSecondsChecked){
        if (isThreeSecondsChecked){
             return 3000;
        }else{
            return 60000;
        }
    }
}
module.exports = ParsingServices;
