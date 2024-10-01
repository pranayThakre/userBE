class HttpError extends Error {
  constructor(message, statusCode) {
    super(message); //super is used to send property to parent class
    this.code = statusCode; // Adds a "code" property
  }
}

module.exports = HttpError;
