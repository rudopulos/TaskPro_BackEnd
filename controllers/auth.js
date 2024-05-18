const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");

const jwt = require("jsonwebtoken");
const User = require("../models/user");
const HttpError = require("../helpers/HttpError");
const sendEmail = require("../helpers/sendEmail");
const controllerWrapper = require("../helpers/decorators");

const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, JWT_SECRET } = process.env;

function generateToken(userId) {
  try {
    // Generating a token using userId
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });

    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error("Failed to generate token.");
  }
}

// Function to send the confirmation email
async function sendConfirmationEmail(userId, email) {
  const validationToken = generateToken(userId);
  const confirmationLink = `http://localhost:5000/api/users/confirm?userId=${userId}&token=${validationToken}`;

  const emailData = {
    to: email,
    subject: "Registration Confirmation",
    text: `Welcome to our site! Please confirm your registration by clicking the following link: ${confirmationLink}`,
    html: `<p>Welcome to our site! Please <a href="${confirmationLink}">confirm your registration</a>.</p>`,
  };

  await sendEmail(emailData);
  console.log("Confirmation email sent successfully.");
}

// Function to register a new user
async function register(req, res) {
  const { name, email, password } = req.body;

  // Check if the email is already in use
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email is already in use" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate a confirmation token
  // const confirmationToken = generateToken();

  // Create the new user with confirmation token
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    emailConfirmed: false,
  });

  // Send the confirmation email
  try {
    await newUser.save();

    // Send the confirmation email with user's ID and validation token
    await sendConfirmationEmail(newUser._id, email);

    res.status(201).json({
      email: newUser.email,
      message:
        "Registration successful! Please check your email to confirm your account.",
    });
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
}
// Function to confirm a user's email
async function confirmEmail(userId, token) {
  try {
    // Verify the token and extract the payload
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the decoded payload contains the correct userId
    if (decoded.userId !== userId) {
      throw new Error("Invalid token.");
    }

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    // Update the user's emailConfirmed status only if it's not already confirmed
    if (!user.emailConfirmed) {
      user.emailConfirmed = true;
      await user.save();
    }

    return user;
  } catch (error) {
    console.error("Error confirming email:", error);
    throw error; // Re-throw the error to handle it at a higher level if needed
  }
}
async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  // if (!user.emailConfirmed) {
  //   throw HttpError(
  //     403,
  //     "Email not confirmed. Please confirm your email first."
  //   );
  // }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw HttpError(401, "Email or password is wrong");
  }
  const payload = { id: user._id };

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_KEY, {
    expiresIn: "10m",
  });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_KEY, {
    expiresIn: "7d",
  });
  await User.findByIdAndUpdate(user._id, { accessToken, refreshToken });
  res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      theme: user.theme,
      avatarURL: user.avatarURL,
    },
  });
}

async function refresh(req, res) {
  const { refreshToken: token } = req.body;
  try {
    const { id } = jwt.verify(token, REFRESH_TOKEN_KEY);
    const isExist = await User.findOne({ refreshToken: token });
    if (!isExist) {
      throw HttpError(403, "Token invalid");
    }
    const payload = {
      id,
    };
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_KEY, {
      expiresIn: "10m",
    });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_KEY, {
      expiresIn: "7d",
    });
    await User.findByIdAndUpdate(id, { accessToken, refreshToken });
    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    throw HttpError(403, error.message);
  }
}

async function getCurrent(req, res) {
  const { _id, name, email, theme, token, avatarURL } = req.user;
  res.json({
    token,
    user: {
      _id,
      name,
      email,
      theme,
      avatarURL,
    },
  });
}

async function logout(req, res) {
  const { id } = req.user;
  await User.findByIdAndUpdate(id, { accessToken: "", refreshToken: "" });
  res.status(204).json();
}

async function updateTheme(req, res) {
  const { _id } = req.user;
  const result = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
    select: "-password -createdAt -updatedAt",
  });
  res.json(result);
}

async function updateProfile(req, res) {
  const { _id } = req.user;

  if (!req.file) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const result = await User.findByIdAndUpdate(
      _id,
      {
        ...req.body,
        password: hashedPassword,
      },
      { new: true, select: "-password -createdAt -updatedAt" }
    );
    res.json(result);
    return;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const upload = req.file.path;

  const result = await User.findByIdAndUpdate(
    _id,
    {
      ...req.body,
      password: hashedPassword,
      avatarURL: upload,
    },
    { new: true, select: "-password -createdAt -updatedAt" }
  );
  res.json(result);
}

async function getHelpEmail(req, res) {
  const { email, comment } = req.body;

  const helpReq = {
    to: "taskpro.project@gmail.com",
    subject: "User need help",
    html: `<p> Email: ${email}, Comment: ${comment}</p>`,
  };
  await sendEmail(helpReq);
  const helpRes = {
    to: email,
    subject: "Support",
    html: `<p>Thank you for you request! We will consider your comment ${comment}</p>`,
  };
  await sendEmail(helpRes);

  res.json({
    message: "Reply email sent",
  });
}

module.exports = {
  register: controllerWrapper(register),
  login: controllerWrapper(login),
  getCurrent: controllerWrapper(getCurrent),
  logout: controllerWrapper(logout),
  updateTheme: controllerWrapper(updateTheme),
  updateProfile: controllerWrapper(updateProfile),
  getHelpEmail: controllerWrapper(getHelpEmail),
  refresh: controllerWrapper(refresh),
  generateToken,
  confirmEmail,
};
