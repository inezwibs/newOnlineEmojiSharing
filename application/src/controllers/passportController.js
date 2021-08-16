const passportLocal = require( "passport-local");
const passport = require( "passport");
const loginServices = require( "../services/loginServices");

let LocalStrategy = passportLocal.Strategy;

// function executeAuthenticate(req,res,next) {
//     passport.authenticate("local", function (err, user, info) {
//         if (err) {
//             return res.redirect("/register")
//         } else {
//             return res.redirect("/sendEmoji")
//         }
//     }) (req,res,next);
// }

let initPassportLocal = () => {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        async (req, email, password, done) => {
            try {
                const isValidUser = await loginServices.handleLogin(email,password, req.body);
                    if (!isValidUser.success) {
                        req.user = isValidUser;
                        req.id = isValidUser;
                        return done(null, false, isValidUser);
                    }
                    else{
                        req.user = isValidUser;
                        return done(null, isValidUser);
                    }
            } catch (err) {
                console.log(err);
                return done(null, false, { message: err });
            }
        }));

};

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {

    done(null, id);
});

module.exports = {
    initPassportLocal: initPassportLocal,
    // executeAuthenticate:executeAuthenticate
};