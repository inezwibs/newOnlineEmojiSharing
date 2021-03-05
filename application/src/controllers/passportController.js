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
                const isValidUser = await loginServices.findUserByEmail(email,password);
                    if (!isValidUser) {
                        return done(null, false, req.flash("errors", `This user email "${email}" doesn't exist`));
                    }
                    else{
                        let match = await loginServices.comparePassword(password, isValidUser);
                        if (match === true) {
                            return done(null, isValidUser, null)
                        } else {
                            return done(null, false, req.flash("errors", match)
                            )
                        }
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

    // loginServices.findUserById(id).then((user) => {
    //     return done(null, user);
    // }).catch(error => {
    //     return done(error, null)
    // });
});

module.exports = initPassportLocal;