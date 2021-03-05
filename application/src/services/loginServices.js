const db = require( "../configs/database");
const bcrypt = require ("bcryptjs");

let handleLogin = async (email, password) => {
    //check email is exist or not
    let user = await findUserByEmail(email);
    if (user) {
        //compare password
        await bcrypt.compare(password, user.password).then((isMatch) => {
            if (isMatch) {
                resolve(true);
            } else {
                reject(`The password that you've entered is incorrect`);
            }
        });
    } else {
        reject(`This user email "${email}" doesn't exist`);
    }

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
            return rows[0];
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