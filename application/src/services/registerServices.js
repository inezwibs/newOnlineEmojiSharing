const db = require("../configs/database.js");
const bcrypt = require("bcryptjs");
const salt =10;
/*
does the user exist check if email exists
is the user registered into this class
 */
let createNewInstructor = async (data) => {
    let message="";
    let result = await checkExistEmail(data.email);
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
            message = `There was an error caught while inserting to database. Error message: "${err}"`;
            return { success: false, body: [], message: message };
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
            return { doesExist: true, body: rows };

        }else{
            return { doesExist: false, body: [] };
        }
    } catch (err) {
        console.log("Catch an error: ", err);
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
    }

};


module.exports = {
    createNewInstructor: createNewInstructor,
    updateUserPassword:updateUserPassword
};
