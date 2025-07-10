const bcrypt = require('bcrypt');

const password = 'Admin@1234'; // You can change this
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function (err, hash) {
  if (err) throw err;
  console.log('Hashed password:', hash);
});
