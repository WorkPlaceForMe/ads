module.exports = (err, req, res, next) => {
  let message;
  let status;

  if (err.statusCode) {
    message = err.message || 'Internal Error';
    status = err.statusCode;
  } else {
    console.log(JSON.stringify({ message: err.message, stack: err.stack }));
    message = 'Internal Error';
    status = 500;
  }

  res.locals.error = message;

  res.status(status).send({ error: message });
};
