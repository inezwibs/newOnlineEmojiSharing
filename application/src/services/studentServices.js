const db = require("../configs/database.js");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

class StudentServices {
    _result = {};
    _isRegistered = false;
    _reqBody = {};

    constructor() {

    }

    async checkExistingClassRegistration(reqBody) {
        this._reqBody = reqBody;
        let message = "";
        let checkResult = await this.doesUserExist();
        // if user does not exist at all
        if (checkResult.success && checkResult.body.length === 0) {
            message = "Let's create a new user account.";
            return {success: true, body: {}, isRegistered: false, message: message};
        }
        // if user exist but maybe or maybe not for this class
        if (checkResult.success && checkResult.body.length > 0) {
            let query = `SELECT *
                         FROM emojidatabase.registrations
                         where users_id = ${checkResult.body[0].id}`;
            try {
                const [rows, err] = await db.execute(query);
                console.log(rows);
                this._result = rows;
                let resultObject = this.isPersonAlreadyRegisteredToThisClass(reqBody.classId);

                if (resultObject.isRegistered) {
                    //then give them message to reset
                    let classObject = await this.getClassDetails(resultObject.body.classes_id);
                    message = `You are already registered for this class ${classObject.body[0].class_name}
                with class id ${classObject.body[0].id}. You can proceed to login using your existing email ${checkResult.body[0].email} and password.`
                    return {success: true, body: classObject, isRegistered: true, message: message};
                } else {//is not yet registered
                    //then let them register
                    message = `You are already a registered user for other classes.\nYou are now also registered for this class id = ${reqBody.classId}.\n` +
                        `Please login with your existing email = ${checkResult.body[0].email} and password.`;
                    return {success: true, body: checkResult.body[0], isRegistered: false, message: message};
                }
            } catch (err) {
                message = "A system error happened."
                return {success: false, error: err, message: message};
            }
        }
    }

    async doesUserExist() {
        let query = `Select *
                     from emojidatabase.users
                     where email = '${this._reqBody.email}'`;
        try {
            const [rows, err] = await db.execute(query);
            if (rows !== null) {
                return {success: true, body: rows};
            } else {
                return {success: true, body: []};
            }
        } catch (e) {
            return {success: false, error: e};
        }
    }


    isPersonAlreadyRegisteredToThisClass(classId) {
        let isFound = false;
        let classRecordReturn = {};
        this._result.forEach(classRecord => {
            if (classRecord.classes_id.toString() === classId) { // if the person is trying to register to a class they are previously registered to
                isFound = true;
                classRecordReturn = classRecord;
            }
        });
        if (isFound){
            return {isRegistered: true, body: classRecordReturn};
        }else{
            return {isRegistered: false, body: {}};
        }
    }

    async getClassDetails(id) {
        let query = `SELECT *
                     FROM emojidatabase.classes
                     where id = ${id}`
        try {
            const [rows, err] = await db.execute(query);
            return {success: true, body: rows};
        } catch (err) {
            return {success: false, error: err};

        }
    }

    async checkForDuplicateRegistration(reqBody,user_id, classIdValue) {
        let errors = [];
        let query =
            " SELECT * FROM emojidatabase.registrations where classes_id = " +
            classIdValue +
            " and users_id = " +
            user_id;
        try {
            const [rows, err] = await db.execute(query);
            // console.log(query);
            let duplicateregistration;
            if (rows !== null && rows.length > 0) {
                duplicateregistration = 1;
                errors.push({msg: "You are already registered for this class. You can proceed to login."})
                return {success: false, body: duplicateregistration, message: errors};
            } else {
                duplicateregistration = 0;
                return {success: true, body: duplicateregistration};
            }
        } catch (e) {
            console.log("Catch an error: ", e);
            errors.push({msg: e})
            return {success: false, error: e, message: errors};
        }
    }

    isEmptyObject(obj) {
        let item;
        for (item in obj) {
            if (obj.hasOwnProperty(item)) {
                return false;
            }
        }
        return true;
    }

    async insertUser(reqBody) {
        const hash = bcrypt.hashSync(reqBody.password, saltRounds);
        let query =
            " INSERT INTO emojidatabase.users (full_name, email, password, isInstructor) VALUES ( '" +
            reqBody.username +
            "' , '" +
            reqBody.email +
            "' , '" +
            hash +
            "', 0)";
        try {
            const [res, err] = await db.execute(query);
            return {success: true, body: res};
        } catch (e) {
            console.log("Catch an error: ", e);
            return {success: false, error: e};
        }
    }

    async insertRegistration(reqBody, user_id, classIdValue) {
        let errors = [];
        let isDuplicateResult = await this.checkForDuplicateRegistration(reqBody,user_id, classIdValue);
        if (isDuplicateResult.success && isDuplicateResult.body === 0) {
            let query =
                " INSERT INTO emojidatabase.registrations (classes_id, users_id, isInstructor) VALUES ( " +
                classIdValue +
                " ," +
                user_id +
                " , 0 )";
            try {
                const [res, err] = await db.execute(query);
                return {success: true, body: res};
            } catch (e) {
                console.log("Catch an error: ", e);
                errors.push({msg: e})
                return {success: false, error: errors};
            }
        }else if (!isDuplicateResult.success && isDuplicateResult.body === 1){
            return {success: false, body: isDuplicateResult.body , error: isDuplicateResult.message};
        } else {// a record registered for the class already exist or system error
            return {success: false, error: isDuplicateResult.error};
        }
    }
}
module.exports = StudentServices;
