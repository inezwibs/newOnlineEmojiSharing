const passportLocal = require( "passport-local");
const passport = require( "passport");
const loginServices = require( "../services/loginServices");

let LocalStrategy = passportLocal.Strategy;

let initPassportLocal = () => {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        async (req, email, password, done) => {
            try {
                const isValidUser = await loginServices.handleLogin(email,password);
                    if (!isValidUser) {
                        return done(null, false, req.flash("errors", `This user email "${email}" doesn't exist`));
                    }
                    else{
                        req.user = isValidUser
                            return done(null, isValidUser[0], isValidUser)
                    }
            } catch (err) {
                console.log(err);
                return done(null, false, { message: err });
            }
        }));

};

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    done(null, id);
});

module.exports = initPassportLocal;