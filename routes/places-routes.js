const express = require('express');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');

const placesController = require('../controllers/places-controller');
const authMiddleWare = require('../middleware/authorization');

const router = express.Router();

router.get('/:pid', placesController.getPlaceById);

router.get('/user/:uid', placesController.getPlacesByUserId);

// this will check and verify the token and add userData into request and
// then only allow requests to pass to below routers
router.use(authMiddleWare);

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  placesController.createPlace
);

router.patch(
  '/:pid',
  [check('title').not().isEmpty(), check('description').isLength({ min: 5 })],
  placesController.updatePlaceById
);

router.delete('/:pid', placesController.deletePlaceById);

module.exports = router;
