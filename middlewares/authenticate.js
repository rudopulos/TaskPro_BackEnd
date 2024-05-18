const jwt = require("jsonwebtoken");
const HttpError = require("../helpers/HttpError");
const User = require("../models/user");
const dotenv = require("dotenv");
dotenv.config();

const { ACCESS_TOKEN_KEY } = process.env;

async function authenticate(req, res, next) {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer") {
    return next(HttpError(401, "Not authorized"));
  }

  if (!token) {
    return next(HttpError(401, "Token missing"));
  }

  try {
    const { id } = jwt.verify(token, ACCESS_TOKEN_KEY);
    const user = await User.findById(id);

    if (!user || !user.accessToken) {
      return next(HttpError(401, "Not authorized"));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    next(HttpError(401, "Not authorized"));
  }
}

module.exports = authenticate;
