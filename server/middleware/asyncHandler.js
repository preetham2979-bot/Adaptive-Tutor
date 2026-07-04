/**
 * Express 4 does not automatically catch rejected promises thrown
 * inside `async` route handlers — unlike synchronous throws, which it
 * does catch. An uncaught rejection in Node defaults to crashing the
 * entire process, not just failing that one request.
 *
 * Wrapping every async handler in this forwards any thrown error to
 * Express's centralized error handler via next(err), the same way a
 * synchronous throw would be handled automatically.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
