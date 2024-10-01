const express = require('express');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');

const usersController = require('../controllers/user-controller');

const router = express.Router();

router.get('/', usersController.getAllUsers);

router.post('/login', usersController.login);

router.post(
  '/signup',
  fileUpload.single('image'), // this look for 'image' key inside request body
  [
    check('email')
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
    check('password').isLength({ min: 6 }),
    check('name').not().isEmpty(),
  ],
  usersController.signup
);

module.exports = router;
