const { nanoid } = require("nanoid");

const generateSessionId = (length = 40) => nanoid(length);


module.exports = { generateSessionId };
