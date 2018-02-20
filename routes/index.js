var models  = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Express' });
  models.User.findAll({}).then(function(users) {
    console.log(users);
    res.render('index', {
      title: 'Printing current users',
      users: users
    });
  });
});

module.exports = router;
