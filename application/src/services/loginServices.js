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


let findUserByEmail = async (req, email) => {
    let queryString =
        " SELECT * FROM emojidatabase.users where email = '" + email + "'";
    // console.log("hellloooo2");
    return db.query(queryString)
        .then(([rows, fields]) => {
            if(!email) return false;
            if(!rows || rows.length === 0){
                console.log("user class: "+rows);
                return true;
            }
            return false;
        });
};

let findUserById = async (id) => {
    let query =
        " SELECT * FROM emojidatabase.users where id = '" + id + "'";
    // console.log("hellloooo2");

    try {
        const [rows, fields] = await db.execute(query);
    } catch (err) {
        reject(err);
    }
};

let comparePassword = (password, userObject) => {
    return new Promise(async (resolve, reject) => {
        try {
            await bcrypt.compare(password, userObject.password).then((isMatch) => {
                if (isMatch) {
                    resolve(true);
                } else {
                    resolve(`The password that you've entered is incorrect`);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    handleLogin: handleLogin,
    findUserByEmail: findUserByEmail,
    findUserById: findUserById,
    comparePassword: comparePassword
};