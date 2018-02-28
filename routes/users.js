var modules = require('../models');
var User = modules.User;
var express = require('express');
var router = express.Router();

/* FETCH USER via GET
 * example url: /users/12341
 **/
router.route('/:user_id')
  .get(function(req, res) {
    modules.User.findById(req.params.user_id, {}).then(user => {
      res.json(user);
    });
  });

/* CREATE USER via POST
 * example url: /users/
 **/
router.post('/', function(req, res) {
  User.create({
    name: req.body.name,
    dob: req.body.dob,
    gender: req.body.gender
  }).then((user) => {
    res.json({ message: 'User Created', req: req.body, user: user });
  });
});

module.exports = router;
