const db = require("../configs/database.js");
const bcrypt = require("bcryptjs");
const salt =10;

let createNewInstructor = async (data) => {
    let isEmailExist = await checkExistEmail(data.email);
    if (isEmailExist) {
        console.log(`This email "${data.email}" has already exist. Please choose an other email`);
    } else {
        const hashedPassword = bcrypt.hashSync(data.password, salt);
        // console.log("hellloooo1");
        // console.log(hash);
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
            const [rows, fields] = await db.execute(query);

            console.log(rows);
            console.log("Create new Instructor account successful");

        } catch (err) {
            console.log("Catch an error: ", err);
            console.log(`There was an error caught while inserting to database. Error message: "${err}"`);

        }

    }
};

let checkExistEmail = async (email) => {
    let query = " SELECT * FROM emojidatabase.users where email = '" + email + "'";
    try {
        const [rows,fields] = await db.execute(query);
        // console.log(query);
        // console.log("res[0].id: "+res[0].id);
        console.log(rows);
        if (rows.length > 0){
            return rows[0].email.length ==0 | rows[0].email.length == undefined ? false : true;
        }else{
            return false;
        }
    } catch (err) {
        console.log("Catch an error: ", err);
    }

};


module.exports = {
    createNewInstructor: createNewInstructor
};
