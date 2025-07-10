const express = require('express');
const router = express.Router();

const categories = [
  { name: 'Plumbing', icon: 'assets/icons/plumbing.png' },
  { name: 'Salon', icon: 'assets/icons/salon.png' },
  { name: 'Catering', icon: 'assets/icons/catering.png' },
  { name: 'Cleaning', icon: 'assets/icons/cleaning.png' },
  { name: 'Mechanic', icon: 'assets/icons/mechanic.png' },
  { name: 'Electrician', icon: 'assets/icons/electrician.png' }
];

router.get('/', (req, res) => {
  res.json(categories);
});

module.exports = router;
