const crypto = require("crypto");

const emailStr = "test@example.com";
const expectedStr = "admin@example.com";

const e1 = crypto.createHash("sha256").update(emailStr).digest();
const e2 = crypto.createHash("sha256").update(expectedStr).digest();

console.log(crypto.timingSafeEqual(e1, e2));
