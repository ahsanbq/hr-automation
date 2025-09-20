const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

// Create a test token for admin user
const token = jwt.sign(
  { userId: -1, email: "admin", type: "ADMIN", companyId: null },
  JWT_SECRET,
  { expiresIn: "7d" }
);

console.log('Test Token:');
console.log(token);
console.log('\nAdd this to localStorage in browser:');
console.log(`localStorage.setItem('token', '${token}');`);
