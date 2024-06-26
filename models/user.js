const { Schema, model } = require("mongoose");

const MongooseError = require("../helpers/MongooseError");

const emailRegExp = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: emailRegExp,
      unique: true,
    },
    password: {
      type: String,
      minlength: 6,
      required: [true, "Password is required"],
    },
    theme: {
      type: String,
      enum: ["light", "dark", "violet"],
      default: "violet",
    },
    emailConfirmed: {
      type: Boolean,
      default: false,
    },
    avatarURL: { type: String },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post("save", MongooseError);

const User = model("user", userSchema);

module.exports = User;
