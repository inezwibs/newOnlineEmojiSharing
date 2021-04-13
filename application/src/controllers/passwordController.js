const db = require("../configs/database.js");
const JWT_SECRET='sfsu-secret'
const jwt = require('jsonwebtoken')
let path = `http://emotionthermometer.online/reset-password/`;
let localPath = `http://localhost:4000/reset-password/`;
const registerService = require("../services/registerServices.js");

async function getForgotPasswordPage (req, res, next) {
    res.render('forgotPassword')
}

async function handlePostForgotPasswordPage (req, res, next) {
    const { email } = req.body;
    // res.send(email);
    /*
    make sure user exists in database
    if not res.send user not registered
     */
    const userObject = await verifyUserEmail(email);
    if ( Object.entries(userObject).length > 0){
        // res.send(`User with ${email} was found`);
        const secret = JWT_SECRET + userObject.password;
        const payload = {
            email: userObject.email,
            id: userObject.id
        }
        const token = jwt.sign(payload,secret, {expiresIn: '15m'})
        const link = path + `${userObject.id}/${token}`;
        console.log(link);
        res.send(`Here\'s the password link ${link}`);
    } else {
        res.send(`User with ${email} was not found`);
    }
}

async function getResetPasswordPage (req, res, next) {
    const {id, token} = req.params;

    const userObject = await verifyUserId(id);
    if ( Object.entries(userObject).length > 0){
    // check if user is valid
        const secret = JWT_SECRET + userObject.password;
        try {
            const payload = jwt.verify(token,secret);
            res.render('resetPassword',{email:userObject.email})
        }catch (e) {
            console.log("**Error Message**" , e);
            res.send(e.message);
        }
    } else {
    //check if user is not valid
        res.send('No user found with this id to reset password. Please try again.');
        res.redirect('/');
    }
}

async function handlePostResetPasswordPage ( req,res,next) {
    const { id, token } = req.params;
    const { password, passwordMatch} = req.body;
    /*
    make sure user exists in database
    if not res.send user not registered
     */
    const userObject = await verifyUserId(id);
    if ( Object.entries(userObject).length > 0){
        // check if user is valid
        const secret = JWT_SECRET + userObject.password;
        try {
            const payload = jwt.verify(token,secret);
            //find the user with the payload email and id and update with tnew
            userObject.password = passwordMatch;
            let isRecordUpdated = await registerService.updateUserPassword(userObject.password,id);
            res.send("Your record has been updated with the new password");
        }catch (e) {
            console.log("**Error Message**" , e);
            res.send(e.message);
        }
    } else {
        //check if user is not valid
        res.send('No user found with this id to reset password. Please try again.');
        res.redirect('/');
    }
}

async function verifyUserEmail (email) {

    let query =
        " SELECT * FROM emojidatabase.users where email = '" + email + "'";

    try{
        const [rows, err ] = await db.execute(query);
        if (rows.length > 0) {
            const user = rows[0];
            return user;
        } else {
            return {};
        }
    } catch(e){
        console.log('error' , e)
    }
}

async function verifyUserId (userId) {

    let query =
        " SELECT * FROM emojidatabase.users where id = '" + userId + "'";

    try{
        const [rows, err ] = await db.execute(query);
        if (rows.length > 0) {
            const user = rows[0];
            return user;
        } else {
            return {};
        }
    } catch(e){
        console.log('error' , e)
    }
}


module.exports = {
    getForgotPasswordPage:getForgotPasswordPage,
    handlePostForgotPasswordPage:handlePostForgotPasswordPage,
    getResetPasswordPage:getResetPasswordPage,
    handlePostResetPasswordPage:handlePostResetPasswordPage
}