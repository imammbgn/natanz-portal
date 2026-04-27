const { v4: uuidv4 } = require('uuid');

function generateId() {
  return uuidv4();
}

function formatUserResponse(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

function successResponse(data = null, message = 'Success') {
  return { success: true, message, data };
}

function errorResponse(message = 'Error', code = 400) {
  return { success: false, message, code };
}

module.exports = { generateId, formatUserResponse, successResponse, errorResponse };
