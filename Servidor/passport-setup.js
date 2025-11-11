const GoogleOneTapStrategy = require("passport-google-one-tap").GoogleOneTapStrategy;
const passport=require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.serializeUser(function(user, done) {
 done(null, user);
});
passport.deserializeUser(function(user, done) {
 done(null, user);
});
// Registrar estrategia Google OAuth 2.0 solo si hay credenciales configuradas
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
	passport.use(new GoogleStrategy({
		clientID: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		callbackURL: process.env.GOOGLE_CALLBACK_URL || ((process.env.BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000') + '/google/callback')
	 },
	 function(accessToken, refreshToken, profile, done) {
		 return done(null, profile);
	 }
	));
} else {
	console.warn('[auth] GOOGLE_CLIENT_ID/SECRET no definidos; se desactiva Google OAuth 2.0');
}

// Registrar One Tap solo si hay credenciales configuradas
if ((process.env.GOOGLE_ONETAP_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) && (process.env.GOOGLE_ONETAP_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)) {
	passport.use(
		new GoogleOneTapStrategy(
			{
				client_id: process.env.GOOGLE_ONETAP_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_ONETAP_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
				verifyCsrfToken: false,
			},
			function (profile, done) {
				return done(null, profile);
			}
		)
	);
} else {
	console.warn('[auth] GOOGLE_ONETAP_CLIENT_ID/SECRET no definidos; se desactiva Google One Tap');
}