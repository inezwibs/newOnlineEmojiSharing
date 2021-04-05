const db = require( "../configs/database");
const bcrypt = require ("bcryptjs");

let handleLogin = async (email, password) => {
    //check email is exist or not
    let user = await findUserByEmail(email);
    let loginResult;
    if (user) {
        //compare password
        await bcrypt.compare(password, user[0].password).then((isMatch) => {
            if (isMatch) {
                console.log("Login successful");
                loginResult =  user;
            } else {
                console.log("The password that you've entered is incorrect");
                loginResult =  undefined;
            }
        });
    } else {
        console.log(`This user email "${email}" doesn't exist`);
        loginResult =  undefined;
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

        if (!email || !rows || rows.length === 0) {
            return false
        } else {
            return rows;
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
             bcrypt.compareSync(password, userObject.password);
                    return true
        } catch (e) {
            console.log(`The password that you've entered is incorrect`);
            console.log(e);
        }

};

module.exports = {
    handleLogin: handleLogin,
    findUserByEmail: findUserByEmail,
    findUserById: findUserById,
    comparePassword: comparePassword
};