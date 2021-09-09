const db = require("../configs/database.js");
const bcrypt = require("bcryptjs");
const emojiController = require("../controllers/emojiController");
const salt =10;
/*
does the user exist check if email exists
is the user registered into this class
 */
let createNewInstructor = async (data) => {
    let message="";
    let result;
    try{
        result = await checkExistEmail(data.email);
    }catch (e) {
        throw e.message;
    }

    if (result.doesExist) {
        message = `This email "${data.email}" already exist in our records. Please choose an other email`;
        return { success: false, body: result.body, message: message };
    } else {
        const hashedPassword = bcrypt.hashSync(data.password, salt);
        console.log("req body name:", data.fullName);
        let query =
            " INSERT INTO emojidatabase.users (full_name, email, password, isInstructor) VALUES ( '" +
            data.fullName +
            "' , '" +
            data.email +
            "' , '" +
            hashedPassword +
            "','" +
            data.isInstructor +
            "')";

        //insert into db
        try {
            const [res, fields] = await db.execute(query);
            console.log(res);
            data.instructorId = res.insertId;
            message = "Create new Instructor account successful";
            return { success: true, body: data, message: message };
        } catch (err) {
            console.log("Catch an error: ", err);
            message = `${err}`;
            return { success: false, body: {}, message: message };
        }
    }
};

let checkExistEmail = async (email) => {
    let query = " SELECT * FROM emojidatabase.users where email = '" + email + "'";
    try {
        const [rows,fields] = await db.execute(query);

        console.log(rows);
        if (rows.length > 0){
            // return rows[0].email.length ==0 | rows[0].email.length == undefined ? false : true;
            return { doesExist: true, body: rows[0] };

        }else{
            return { doesExist: false, body: {} };
        }
    } catch (err) {
        console.log("Catch an error: ", err);
        throw err;
    }
};


let updateUserPassword = async (newPassword, id) => {
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

    let query = " UPDATE emojidatabase.users SET password ='" + hashedNewPassword + "' " +
        "where id = '" + id + "'";
    try {
        const [rows,fields] = await db.execute(query);

        console.log(rows);
        if (rows.affectedRows > 0){
            return true;
        }else{
            return false;
        }
    } catch (err) {
        console.log("Catch an error: ", err);
        throw err;
    }

};


let validateClassLinks = async (classLinkId, classId ) => {
    let message = "";
    let query = `SELECT * FROM emojidatabase.registrations where id = ${classLinkId} AND classes_id = ${classId} and isInstructor = 1`;
    let isFound = false;
    let classRecordReturn = {};

    try{
        const [rows, err] = await db.execute(query);
        if (rows === undefined || rows.length === 0) {
            // when no user id and class id match is found
            isFound = false;
            message = "Class was not found. Please look up unique class link to find the correct class link and use it to create a student account or login."
            classRecordReturn = {};

        }else {
            // this._result is assigned when there is a user id and class id match
            isFound = true;
            this._result = rows;
            message = "Class is found. You can register for this class."
            classRecordReturn = this._result[0];
        }
    } catch (err) {
        // err will be what is thrown
        // message = "A system error occurred. Please retry by looking up your class link or clearing or browser cache."
        // return {success: false, error: err, message: message};
        throw err;
    }
    return {success: isFound, body: classRecordReturn, message: message};
}

module.exports = {
    createNewInstructor: createNewInstructor,
    updateUserPassword:updateUserPassword,
    validateClassLinks: validateClassLinks
};
