const db = require("../configs/database.js");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const ParsingService = require("../services/parsingServices");
const parsingService = new ParsingService();
const re = /\d+/g;

class StudentServices {
    _result = {};
    _isRegistered = false;
    _reqBody = {};
    _classIdValue = "";
    _doesUserExist = {};
    constructor() {

    }

    getClassDetailsFromReq(reqBody, reqHeaders){
        if (reqBody.classId && reqBody.classLinkId){
            return {classLinkId: reqBody.classLinkId, classId : reqBody.classId};
        } else if (reqHeaders.referer) {
            if (reqHeaders.referer.match(re)?.length > 2) {
                let ids = parsingService.getIdsFromUrl(reqHeaders.referer);
                ids = ids.filter(notPort => notPort !== '4000'); // will return query params that are not the 4000 port
                if (ids && ids.length === 2) {
                    return {classLinkId:ids[0], classId : ids[1]};
                }
            }else{
                return {};
            }
        }else{
            return {};
        }
    }


    async checkExistingClassRegistration(reqBody, classLinkIdValue, classIdValue, doesUserExist) {
        this._reqBody = reqBody;
        this._classIdValue = classIdValue;
        this._classLinkIdValue = classLinkIdValue;
        let message = "";
        this._doesUserExistResult = doesUserExist ;
        // if user does not exist at all
        let userDetails;
        if (!this._doesUserExistResult) {
            //user does not exist at all , not for any class, insert user in Users dbase
            let insertResult;
            try{
                await this.insertUser();
            }catch (e) {
                throw e;
            }
            userDetails = await this.doesUserExist(); //second time to get the id
            if (userDetails.success){
                const result = await this.registerUserIntoCurrentClass(userDetails)
                return result;
                //user now exist , but not for any class yet
                // check if we have the class details i.e class id check reqbody or classidValue
            }else{
                throw userDetails.error;
            }

        }
        // if user exist but maybe or maybe not for this class
        else if (this._doesUserExistResult) {
            userDetails = await this.doesUserExist(); //second time to get the id
            const result = await this.registerUserIntoCurrentClass(userDetails)
            return result;
        }
    }

    async registerUserIntoCurrentClass(userDetails) {


        let resultObject;
        try{
            resultObject = await this.isPersonAlreadyRegisteredToThisClass(this._classIdValue, userDetails.body[0].id);
            let errors = [];
            let message;
            if (resultObject.isRegisteredForClass) {
                // if user is registered already for this class
                let classObject = await this.getClassDetails(resultObject.body.classes_id);
                message = `You are already registered for this class ${classObject.body[0].class_name} with class id ${classObject.body[0].id}. You can proceed to login using your existing email ${userDetails.body[0].email} and password.`
                if (classObject.success) {
                    return {
                        success: true,
                        body: resultObject.body,
                        isRegistered: resultObject.isRegisteredForClass,
                        message: message
                    };
                } else {
                    //classObject.success is not true
                    message = `A system error occurred.`
                    return {
                        success: false,
                        body: classObject.error,
                        isRegistered: resultObject.isRegisteredForClass,
                        message: message
                    };
                }
            } else if (resultObject.isRegisteredForClass !== undefined && resultObject.isRegisteredForClass === false) {//is not yet registered
                //then let them register if the class is valid
                let insertResults = await this.insertRegistration(userDetails.body[0].id, this._classIdValue); // returnerror

                if (insertResults.success) {
                    message = `You are now a user registered for this class, with class id = ${this._classIdValue}.\n` +
                        `Please login with your existing email = ${userDetails.body[0].email} and password.`
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
        } catch (e) {
            throw e;
        }//return error
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
            throw err;
        }
        return {isRegisteredForClass: isFound, body: classRecordReturn};
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

    //TESTED
    async doesUserExist(reqBody = this._reqBody) {
        let query = `Select * from emojidatabase.users where email = '${reqBody.email}'`;
        try {
            const [rows, err] = await db.execute(query);
            if (rows !== null && rows.length > 0) {
                //user exists
                return {success: true, body: rows};
            } else {
                //user does not exist
                return {success: true, body: [], message: "There is no account for the email you entered. Register to create your username and password."};
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
    async getUserAndClassDetails(regId, classId) {
        let query = `SELECT u.id, u.full_name, r.id, r.users_id, c.id, c.class_name, c.datetime 
                    FROM emojidatabase.users u,emojidatabase.registrations r, emojidatabase.classes c 
                    WHERE r.id = ${regId} AND c.id = ${classId} AND u.id = r.users_id`

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
            throw e;
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
            throw e;
        }
        return result;
    }
    // async getSessionData(reqBody = this._reqBody) {
    //     let query = `Select *
    //                  from emojidatabase.sessions
    //                  where id = '${reqBody.id}'`;
    //     try {
    //         const [rows, err] = await db.execute(query);
    //         if (rows !== null && rows.length > 0) {
    //             //user exists
    //             return {success: true, body: rows};
    //         } else {
    //             //user does not exist
    //             return {success: true, body: [], message: "There is no data. Register to create your username and password."};
    //         }
    //     } catch (e) {
    //         return {success: false, error: e};
    //     }
    // }
}
module.exports = StudentServices;
