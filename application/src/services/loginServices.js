const db = require( "../configs/database");
const bcrypt = require ("bcryptjs");
const ParsingService = require("../services/parsingServices");
const parsingService = new ParsingService();
const re = /\d+/g;

let handleLogin = async (email, password, reqBody, reqHeaders) => {
    //check email is exist or not
    email = email.replace(/\s/gm, "");
    let user;
    try{
        user = await findUserByEmail(email);
    }catch (e) {
        throw e;
    }

    let loginResult, message;
    if (user && user[0].isInstructor) {
        //compare password
        await bcrypt.compare(password, user[0].password).then((isMatch) => {
            if (isMatch) {
                console.log("Login successful");
                message = "Login successful"
                loginResult =  { success: true, user: user, body: reqBody, message: message};
            } else {
                console.log("The password that you've entered is incorrect");
                message = "The password that you've entered is incorrect"
                loginResult =  { success: false, user: user, body: reqBody, message: message};
            }
        });
    } else if (user && !user[0].isInstructor) {
        // user is not an instructor and exist or not for this class
        let isRegisteredForClass;
        let classId;
        try{
            if (reqBody) {
                if (reqBody.classId) {
                    classId = reqBody.classId;
                    loginResult = await findUserHelper (user, classId, reqBody, email, password);

                } else if (reqHeaders.referer && reqHeaders.referer.match(re)?.length > 2) {
                    let ids = parsingService.getIdsFromUrl(reqHeaders.referer);
                    ids = ids.filter(notPort => notPort !== '4000'); // will return query params that are not the 4000 port
                    if (ids && ids.length === 2) {
                        let classLinkId = ids[0];
                        classId = ids[1];
                        loginResult = await findUserHelper (user, classId, reqBody, email, password);
                    }

                } else {
                    // else if user exists, not an instructor and reqbody has no class id,  we can't determine which class they are registered
                    message = "User exists as a student but no class info can be determined or password incorrect. Look up class link or reset password if you have forgotten. "
                    console.log(message);
                    loginResult = {success: false, user: user, body: reqBody, message: message};
                }


            } else{
                // else if user exists, not an instructor and reqbody has no class id,  we can't determine which class they are registered
                message = "User exists as a student but class info is missing and unique class link cannot be determined. Please look up and use your class link to register/login. "
                console.log(message);
                loginResult = {success: false, user: user, body: reqBody, message: message};
            }
        }catch (e) {
            throw e;
        }

    } else{
        console.log(`This user email "${email}" doesn't exist in our records. Please register.`);
        message = `This user email "${email}" doesn't exist in our records. Please register.`
        loginResult =  { success: false, user: user, body: reqBody, message: message};
    }
    return loginResult;
};

let findUserHelper = async (user, classId, reqBody, email,password)=>{
    let isRegisteredForClass;
    let message, loginResult;
    if (classId !== undefined){
        try{
            isRegisteredForClass = await findUserClassReg(user[0].id, classId)
        }catch (e) {
            throw e;
        }
        if (isRegisteredForClass) {
            await bcrypt.compare(password, user[0].password).then((isMatch) => {
                if (isMatch) {
                    console.log("Login successful");
                    message = "Login successful"
                    loginResult = {success: true, user: user, body: reqBody, message: message};
                } else {
                    console.log("The password that you've entered is incorrect");
                    message = "The password that you've entered is incorrect"
                    loginResult = {success: false, user: user, body: reqBody, message: message};
                }
            });

        } else {
            message = `This user with this "${email}"  is a student and found in our records. But class vales are missing or link to this class is not found. Please look up and use your class link to register/login.`
            console.log(message);
            loginResult = {success: false, user: user, body: reqBody, message: message};
        }
    }
    return loginResult;
}

let findUserClassReg = async (id, classId) => {

    let queryString = `SELECT * FROM emojidatabase.registrations WHERE users_id = ${id} AND classes_id = ${classId}`

    try {
        const [rows, fields] = await db.execute(queryString);

        console.log(rows);

        if (rows && rows.length > 0) {
            return rows
        } else {
            return false;
        }
    } catch (err) {
        console.log("Catch an error: ", err);
        console.log(`There was an error caught while finding user in database. Error message: "${err}"`);
        throw err;
    }
};

let findUserByEmail = async (email, pass) => {
    let queryString =
        " SELECT * FROM emojidatabase.users where email = '" + email + "'";
    try {
        const [rows, fields] = await db.execute(queryString);

        console.log(rows);

        if (rows && rows.length > 0) {
            return rows
        } else {
            return false;
        }
    } catch (err) {
        console.log("Catch an error: ", err);
        console.log(`There was an error caught while finding user in database. Error message: "${err}"`);
        throw err;
    }
};

let findUserById = async (id) => {
    let query =
        " SELECT * FROM emojidatabase.users where id = '" + id + "'";

    try {
        const [rows, fields] = await db.execute(query);
        return rows;
    } catch (err) {
        console.log(err);
    }
};


module.exports = {
    handleLogin: handleLogin,
    findUserByEmail: findUserByEmail,
    findUserById: findUserById,
};