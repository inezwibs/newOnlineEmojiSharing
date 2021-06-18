const db = require("../configs/database.js");

class InstructorServices {
    _result = {};
    constructor() {

    }

    async checkExistingInstructor ( reqBody, userId ) {
        let query = "SELECT * FROM emojidatabase.registrations WHERE isInstructor ="+
            1 + " AND users_id = '" + userId + "'" ;

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

    async getClassID(reqBody) {
        let query =
            " SELECT * FROM emojidatabase.classes where class_name = '" + reqBody.className + "' and datetime = '" +
            reqBody.weekday +
            "-" +
            reqBody.startTime +
            "-" +
            reqBody.endTime +
            "'";
        // instructorObj = res.locals;
        try {
            const [rows, err] = await db.execute(query);
            // console.log(query);
            return { success: true, body: rows };
        } catch (e) {
            console.log("Catch an error: ", e);
            return { success: false, body: e };
        }
    }

}

module.exports = InstructorServices;
