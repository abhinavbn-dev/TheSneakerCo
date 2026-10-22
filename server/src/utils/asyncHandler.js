// Lets us write async route handlers without try/catch in every one.
// Any error is passed to the error middleware in middleware/error.js.
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
