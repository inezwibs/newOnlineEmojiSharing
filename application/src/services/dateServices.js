const db = require("../configs/database.js");

class DateService {

    parseDateTimeRecord(dateTimeRecord){
        let dateTime = new Date(Date.parse(dateTimeRecord));
        return dateTime.toLocaleDateString();
    }

    async getRecordDate ( reqBody, insertMinutes ) {
        let query =
            " SELECT date_time FROM emojidatabase.posted_emojis where minute = " +
            insertMinutes +
            " and users_id = " +
            reqBody.userId +
            " and class_id = " +
            reqBody.classId;

        try {
            // We only pass the body object, never the req object
            const [rows,err] = await db.execute(query);
            console.log(rows);
            return { success: true, body: rows[0].date_time };
        } catch ( err ) {
            return { success: false, error: err };
        }
    }

    async getRecordDateFromEmojiRecords ( reqBody, insertMinutes ) {
        let query =
            " SELECT * FROM emojidatabase.emojiRecordsPerMinute where minute = " +
            insertMinutes +
            " and users_id = " +
            reqBody.userId +
            " and class_id = " +
            reqBody.classId;

        try {
            // We only pass the body object, never the req object
            const [rows,err] = await db.execute(query);
            console.log(rows);
            return { success: true, body: rows };
        } catch ( err ) {
            return { success: false, error: err };
        }
    }
}

module.exports = DateService;
