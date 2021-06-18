const db = require("../configs/database.js");

class DateService {
    _result = {};
    constructor() {

    }

    parseDateTimeRecord(dateTimeRecord){
        let dateTime = new Date(Date.parse(dateTimeRecord));
        return dateTime.toLocaleDateString();
    }

    async getRecordDate ( reqBody, insertMinutes ) {
        let query =
            " SELECT * FROM emojidatabase.posted_emojis where minute = " +
            insertMinutes +
            " and users_id = " +
            reqBody.userId +
            " and class_id = " +
            reqBody.classId;

        try {
            // We only pass the body object, never the req object
            const [rows,err] = await db.execute(query);
            console.log(rows);
            this._result = rows;
            return { success: true, body: rows };
        } catch ( err ) {
            return { success: false, error: err };
        }
    }

    async getRecordDateFromEmojiRecords ( reqBody, insertMinutes ) {
        let query =
            " SELECT * FROM emojidatabase.emojiRecordsPerMinute where min = " +
            insertMinutes +
            " and users_id = " +
            reqBody.userId +
            " and classes_id = " +
            reqBody.classId;

        try {
            // We only pass the body object, never the req object
            const [rows,err] = await db.execute(query);
            console.log(rows);
            this._result = rows;
            return { success: true, body: rows };
        } catch ( err ) {
            return { success: false, error: err };
        }
    }

    findMatchingRecord(currentDateString){
        let recordDateList = [];
        this._result.forEach( record => {
            recordDateList.push(this.parseDateTimeRecord(record.date_time));
        })
        if (recordDateList.indexOf(currentDateString) > -1){
            let index = recordDateList.indexOf(currentDateString);
            // send back the body of the object not just the date
            return { success: true, body: this._result[index] };
        }else{
            return  {success: false, body: [] };
        }
    }
    findMatchingObjectsList(listToSearch, currentDateString){
        let userInfoList = [];
        let tempDate;
        listToSearch.forEach( record => {
            tempDate = this.parseDateTimeRecord(record.date_time);
            if (tempDate === currentDateString){
                userInfoList.push(record)
            }
        })
        return userInfoList;
    }
}

module.exports = DateService;
