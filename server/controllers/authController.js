const authController = {};
//verify user controller
authController.verifyUser = async (req, res, next) => {
  //destructure user and pass from req.body
  const { user, pass } = req.body;
  console.log('user', user);
  console.log('pass', pass);
  //try catch block
  try {
    //if user
    if (
      (user === 'chiquita banana' && pass === 'chiquitabanana') ||
      (user === 'c' && pass === 'c')
    ) {
      return next();
    } else {
      return next({
        log: 'Unsuccessful login attempt',
        status: 400,
        message: { err: 'Unsucessful login attempt' },
      });
    }
  } catch (err) {
    return next(err);
  }
};

authController.setCookie = async (req, res, next) => {
  res.cookie('token', 'poN&p75');
  return next();
};

authController.verifyCookie = async (req, res, next) => {
  const { token } = req.cookies;
  if (token === 'poN&p75') {
    return next();
  } else {
    return res.status(400).json('please login to view this page');
  }
};

module.exports = authController;
