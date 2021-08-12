const db = require("../configs/database.js");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

class StudentServices {
    _result = {};
    _isRegistered = false;
    _reqBody = {};
    _classIdValue = "";

    constructor() {

    }

    async checkExistingClassRegistration(reqBody,classIdValue) {
        this._reqBody = reqBody;
        this._classIdValue = classIdValue;
        let message = "";
        let doesUserExistResult = await this.doesUserExist();

        // if user does not exist at all
        if (doesUserExistResult.success && doesUserExistResult.body.length === 0) {
            //user does not exist at all , not for any class, insert user in Users dbase
            let insertResult = await this.insertUser();
            if (insertResult.success){
                doesUserExistResult = await this.doesUserExist(); //second time to get the id
                //user now exist , but not for any class, register user in Registrations dbase
                const result = await this.registerUserIntoCurrentClass(doesUserExistResult)
                return result;
            }else{
                message = insertResult.error;
                return {success: false, body: {}, isRegistered: false, message: message};
            }
        }
        // if user exist but maybe or maybe not for this class
        else if (doesUserExistResult.success && doesUserExistResult.body.length > 0) {
            const result = await this.registerUserIntoCurrentClass(doesUserExistResult)
            return result;
            //tested
        }
    }

    async registerUserIntoCurrentClass(doesUserExistResult) {
        let resultObject;
        resultObject = await this.isPersonAlreadyRegisteredToThisClass(this._classIdValue, doesUserExistResult.body[0].id);
        let errors = [];
        let message;
        //TODO test if person is already registered next
        if (resultObject.isRegistered) {
            // if user is registered already for this class
            let classObject = await this.getClassDetails(resultObject.body.classes_id);
            message = `You are already registered for this class ${classObject.body[0].class_name} with class id ${classObject.body[0].id}. You can proceed to login using your existing email ${doesUserExistResult.body[0].email} and password.`
            if (classObject.success) {
                return {
                    success: true,
                    body: resultObject.body,
                    isRegistered: resultObject.isRegistered,
                    message: message
                };
            } else {
                //classObject.success is not true
                message = `A system error occurred.`
                return {
                    success: false,
                    body: classObject.error,
                    isRegistered: resultObject.isRegistered,
                    message: message
                };
            }
        } else {//is not yet registered
            //then let them register
            let insertResults = await this.insertRegistration(doesUserExistResult.body[0].id, this._classIdValue);
            if (insertResults.success) {
                message = `You are now a user registered for this class, with class id = ${this._classIdValue}.\n` +
                    `Please login with your existing email = ${doesUserExistResult.body[0].email} and password.`
                return {success: insertResults.success, body: insertResults.body, isRegistered: true, message: message};
            } else {
                message = `A system error occurred.`
                // when system error occurs no body obj occurs in results object
                return {
                    success: insertResults.success,
                    body: insertResults.error,
                    isRegistered: false,
                    message: message
                };
            }
        }
    }

    async isPersonAlreadyRegisteredToThisClass(classId, userId) {
        let message = "";
        let query = `SELECT * FROM emojidatabase.registrations where classes_id = ${classId} and users_id = ${userId}`;
        let isFound = false;
        let classRecordReturn = {};

        try{
            const [rows, err] = await db.execute(query);
            if (rows === undefined || rows.length === 0) {
                // when no user id and class id match is found
                isFound = false;
                classRecordReturn = {};

            }else {
                // this._result is assigned when there is a user id and class id match
                isFound = true;
                this._result = rows;
                classRecordReturn = this._result[0];
            }
        } catch (err) {
            // err will be what is thrown
            message = "A system error occurred."
            return {success: false, error: err, message: message};
        }
        return {isRegistered: isFound, body: classRecordReturn};
    }

    async insertRegistration(user_id,classIdValue) {
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
                return {success: false, error: e};
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



    isEmptyObject(obj) {
        let item;
        for (item in obj) {
            if (obj.hasOwnProperty(item)) {
                return false;
            }
        }
        return true;
    }

    async insertUser() {
        const hash = bcrypt.hashSync(this._reqBody.password, saltRounds);
        let query =
            " INSERT INTO emojidatabase.users (full_name, email, password, isInstructor) VALUES ( '" +
            this._reqBody.username +
            "' , '" +
            this._reqBody.email +
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


    async getEmojiClassData(userInfo, classLinkId, classId) {
        let userQuery;
        // let userInfoType = userInfo.indexOf('@');
        if (userInfo.length > 4) {
            userQuery = "SELECT u.full_name, u.id,  c.class_name, c.datetime, r.classes_id " +
                "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
                "WHERE u.id = r.users_id " +
                "AND c.id = r.classes_id " +
                "AND u.email = '" + userInfo + "'";
        }else {
            userQuery = "SELECT u.full_name, u.id,  c.class_name, c.datetime, r.classes_id " +
                "FROM emojidatabase.users u, emojidatabase.registrations r, emojidatabase.classes c " +
                "WHERE u.id = r.users_id " +
                "AND c.id = r.classes_id " +
                "AND u.id = '" + userInfo + "'";
        }
        let result;
        try {
            const [rows, fields] =  await db.execute(userQuery);
            if (rows === undefined || rows.length === 0) {
                console.log("User does not exist. Please register.")
                result = 0;
            } else if (classId !== 0 || classId !== undefined ){
                rows.forEach( row => {
                    var temp = parseInt(classId);
                    if (row.classes_id === temp){
                        result = row;
                    }
                });
            } else if (classId === 0 || classId === undefined && rows){
                //meaning no regId was provided then we pick first one
                result = rows[0];
            }
        } catch (e) {
            console.log(e);
        }
        return result;
    }

}
module.exports = StudentServices;
