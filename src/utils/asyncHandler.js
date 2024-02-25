const asyncHandler = (handlerFunction) => {
  (req, res, next) => {
    // Wrap the handler function in a promise
    Promise.resolve(handlerFunction(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler1 = (fn) => async (req, res, next) => {
//   try {
//   } catch (error) {
//     res
//       .status(error.code || 500)
//       .json({
//         success: false,
//         message: error.message || "Internal Server Error",
//       });
//   }
// };
