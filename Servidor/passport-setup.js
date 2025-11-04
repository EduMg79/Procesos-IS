const GoogleOneTapStrategy = require("passport-google-one-tap").GoogleOneTapStrategy;
const passport=require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.serializeUser(function(user, done) {
 done(null, user);
});
passport.deserializeUser(function(user, done) {
 done(null, user);
});
passport.use(new GoogleStrategy({
clientID: "747124604783-2dbkftslri635jj8abl4jfvq05fcu59d.apps.googleusercontent.com", 
clientSecret: "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",
 callbackURL: "http://localhost:3000/google/callback"
 },
 function(accessToken, refreshToken, profile, done) {
 return done(null, profile);
 }
));

passport.use(
new GoogleOneTapStrategy(
{
//client_id:"xxxxxxx.apps.googleusercontent.com", //local
client_id:"747124604783-2dbkftslri635jj8abl4jfvq05fcu59d.apps.googleusercontent.com", //prod-oneTap
//clientSecret: "xxxx", //local
clientSecret:"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",
verifyCsrfToken: false, // whether to validate the csrf token or not
},
function (profile, done) {
return done(null, profile);
}
)
);