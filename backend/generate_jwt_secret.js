const crypto = require('crypto');

const generateRandomString = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

const jwtSecret = generateRandomString(64); // Génère une chaîne de 64 caractères hexadécimaux
console.log(jwtSecret);
