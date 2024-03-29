const jwtSecret = "your_jwt_secret"; // This has to be the same key used in the JWTStrategy

const jwt = require("jsonwebtoken"),
  passport = require("passport");

require("./passport"); // Your local passport file

/**
 * creates JWT (expring in 8 hours using HS256 algorithm to encode)
 * @param {object} user
 * @returns user object, jwt, and additional information on token
 */
let generateJWTToken = (user) => {
    //console.log('user', user);
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username you’re encoding in the JWT
    expiresIn: "8h", // This specifies that the token will expire in 8 hours
    algorithm: "HS256", // This is the algorithm used to “sign” or encode the values of the JWT
  });
};

/* POST login. */

/**
 * handles user login, generating a jwt upon login
 * @function generateJWTToken
 * @param {*} router
 * @returns user object with jwt
 * @requires passport
 */

module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};