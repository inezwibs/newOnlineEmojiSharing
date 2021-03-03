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
// static async findUser(email, pass) {
//     return db.query('SELECT * FROM emojidatabase.users WHERE email = ?', email)
//         .then(([rows, fields]) => {
//             // console.log(rows.length+rows.email);
//             if (!rows || rows == null || rows.length !== 1) {
//                 return false;
//             }
//             if(bcrypt.compareSync(pass, rows[0].password)){
//                 console.log("return email"+rows[0].email);
//                 console.log("return user_id"+rows[0].id);
//                 return rows[0];
//             }else{
//                 return false;
//             }
//         });
// }

let findUserByEmail = async (email, pass) => {
    let queryString =
        " SELECT * FROM emojidatabase.users where email = '" + email + "'";
    // console.log("hellloooo2");
    return db.query(queryString)
        .then(([rows, fields]) => {
            if(!email || !rows || rows.length === 0){
                return false
            }else{
                //if email or rows exist compare password
                if(bcrypt.compareSync(pass, rows[0].password)) {
                console.log("return email"+rows[0].email);
                console.log("return user_id"+rows[0].id);
                return rows[0];
                }else{
                    return false
                }
            }
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