const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const fs = require('fs');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find place for the provided Id',
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "Couldn't find place for the provided Id.",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) }); // { place } => { place : place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  // let places;
  let allPlacesForUser;
  try {
    // places = await Place.find({ creator: userId });
    allPlacesForUser = await User.findById(userId).populate('places'); //alternate method using populate
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find place for the provided user id',
      500
    );
    return next(error);
  }
  if (!allPlacesForUser) {
    return next(
      new HttpError("Couldn't find place for the provided User Id.", 404)
    );
  }
  res.json({
    places: allPlacesForUser.places.map((p) => p.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  const { title, description, address } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError('Creating Place Failed, please try again.', 500));
  }

  if (!user) {
    return next(new HttpError('Could not find user for provided Id.', 404));
  }

  const sess = await mongoose.startSession();

  try {
    // cocept of session & transaction are used to execute multiple actions together and abort all the action
    // if any of the actions fail
    sess.startTransaction(); // Start the transaction
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace); // only the id of createdPlace is pushed here
    await user.save({ session: sess });
    await sess.commitTransaction(); // Commit the transaction if everything is successful
  } catch (err) {
    // Abort the transaction in case of an error
    await sess.abortTransaction();
    // Pass the error to the next middleware
    return next(new HttpError('Creating Place Failed, please try again.', 500));
  } finally {
    // End the session
    sess.endSession();
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError('Something went wrong, could not update the place', 500)
    );
  }

  // creator is mongoose objectId type so need to use toString method to convert it to string
  if (place.creator.toString() !== req.userData.userId) {
    return next(
      new HttpError('You are not authorized to edit this place', 401)
    );
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(
      new HttpError('Something went wrong, could not update the place', 500)
    );
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    // here we are able to use populate cause we use ref in the both Place and User model
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    return next(
      new HttpError('Something went wrong, could not delete place', 500)
    );
  }
  if (!place) {
    return next(
      new HttpError(
        'Delete failed, Could not find the place for the provided id',
        404
      )
    );
  }

  //cause creator here is a full user document that's why creator.id and not creator.toString()
  if (place.creator.id !== req.userData.userId) {
    return next(
      new HttpError('You are not authorized to delete this place', 401)
    );
  }

  const sess = await mongoose.startSession();
  const imagePath = place.image;
  try {
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    // able to save the user from place.creator because of populate. populate link whole document from user
    // collection to the creator for that id
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    await sess.abortTransaction();
    return next(
      new HttpError('Something went wrong, could not delete place', 500)
    );
  } finally {
    sess.endSession();
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.json({ message: 'Place Id deleted.' });
};

module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlaceById,
  deletePlaceById,
};
