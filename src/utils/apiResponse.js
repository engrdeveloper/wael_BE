module.exports = {
  success: (data, statusCode = 200) => {
    return (req, res) => {
      const response = {
        success: true,
        data,
      };
      res.status(statusCode).json(response);
    };
  },

  error: (error, message, statusCode = 500) => {
    console.log(error);
    return (req, res) => {
      res.status(statusCode).json({
        success: false,
        error: {
          message: message,
          reason: error.message,
        },
      });
    };
  },
};
