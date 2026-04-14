const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const port = process.env.PORT || 5000;
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vyg2lvk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;




const app = express();

// Middleware function that runs on every request (app.use)
app.use(express.json()); // cleaner than bodyParser, and it is built in to express, so no need to install body-parser package

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use('/api/places', placesRoutes);

app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route', 404);
  throw error;
});

// special middleware function for error handling, which is recongnised by express due
// to 4 props (1 additional prop at the begining error)
//  should be after we register all the routes
app.use((error, req, res, next) => {
  //multer addes this file key to req object if there is a file in the body
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) { //indicates whether the HTTP response headers have already been sent to the client
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occured!' });
});

mongoose
  .connect(url)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at port ${port}`);
    });
  })
  .catch((err) => console.log('Mongodb Atlas connection failed', err));
