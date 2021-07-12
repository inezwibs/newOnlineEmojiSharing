const db = require( "../configs/database");
const bcrypt = require ("bcryptjs");

let handleLogin = async (email, password, reqBody) => {
    //check email is exist or not
    email = email.replace(/\s/gm, "");
    let user = await findUserByEmail(email);
    let loginResult, message;
    if (user) {
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
    } else {
        console.log(`This user email "${email}" doesn't exist for this class`);
        message = `This user email "${email}" doesn't exist for this class`
        loginResult =  { success: false, user: user, body: reqBody, message: message};
    }
    return loginResult;
};

let findUserByEmail = async (email, pass) => {
    let queryString =
        " SELECT * FROM emojidatabase.users where email = '" + email + "'";
    // console.log("hellloooo2");
    try {
        const [rows, fields] = await db.execute(queryString);

        console.log(rows);

        if (rows) {
            return rows
        } else {
            return false;
        }
    } catch (err) {
        console.log("Catch an error: ", err);
        console.log(`There was an error caught while finding user in database. Error message: "${err}"`);
    }
};

let findUserById = async (id) => {
    let query =
        " SELECT * FROM emojidatabase.users where id = '" + id + "'";
    // console.log("hellloooo2");

    try {
        const [rows, fields] = await db.execute(query);
        return rows;
    } catch (err) {
        console.log(err);
    }
};

let comparePassword = (password, userObject) => {
        try {
             return !!bcrypt.compareSync(password, userObject.password);

        } catch (e) {
            console.log(`The password that you've entered is incorrect`);
            console.log(e);
            return false;

        }

};

module.exports = {
    handleLogin: handleLogin,
    findUserByEmail: findUserByEmail,
    findUserById: findUserById,
    comparePassword: comparePassword
};