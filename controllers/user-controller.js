const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    return next(new HttpError('Fetching users failed, please try again.', 500));
  }
  res.json({ users: users.map((u) => u.toObject({ getters: true })) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError('Login Failed, please try again.', 500));
  }

  if (!existingUser) {
    return next(new HttpError('Invalid Credentials, Could not login', 403));
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(new HttpError('Login Failed, please try again.', 500));
  }

  if (!isPasswordValid) {
    return next(new HttpError('Invalid Credentials, Could not login', 403));
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.PRIVATE_KEY,
      { expiresIn: '10m' }
    );
  } catch (err) {
    return next(new HttpError('Login Failed, please try again.', 500));
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token,
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError('Signup Failed, please try again.', 500));
  }

  if (existingUser) {
    return next(
      new HttpError('User already exists, please login instead', 422)
    );
  }

  let hashPassword;
  try {
    hashPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError('Signup Failed, please try again.', 500));
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError('Signup failed, please try again.', 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.PRIVATE_KEY,
      { expiresIn: '10m' }
    );
  } catch (err) {
    return next(new HttpError('Signup failed, please try again.', 500));
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token });
};

module.exports = { getAllUsers, login, signup };
