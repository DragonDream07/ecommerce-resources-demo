const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    await authService.logout(token);
    return res.status(200).json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword({ email });
    return res.status(200).json({
      success: true,
      message: 'If that email address is in our system, we have sent a password reset link.',
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword({ token, password });
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const guestRegister = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const result = await authService.guestRegister({ name, email });
    return res.status(201).json({
      success: true,
      message: 'Guest registration successful.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};
