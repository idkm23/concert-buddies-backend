var modules = require('../models');
var User = modules.User;
var express = require('express');
var router = express.Router();
var FB = require('fb');

/* FETCH USER via GET
 * example url: /users/12341
 **/
router.route('/:fb_id')
  .get(function(req, res) {
    User.findById(req.params.fb_id, {}).then(user => {
      if (user == null) {
        res.json({ message: "User not found", req: req.body });
        return;
      }
      FB.setAccessToken(user.fb_token);
      FB.api('me/', { fields: ['id', 'name', 'about', 'birthday', 'picture.width(640)'] }, function (fb_res) {
        if(!fb_res || fb_res.error) {
          console.log(!fb_res ? 'error occurred' : fb_res.error);
          res.json({ messsage: !fb_res ? 'error occurred' : fb_res.error });
          return;
        }
        res.json(fb_res);
      });
    });
  });

/* CREATE USER via POST
 * example url: /users/
 **/
router.post('/', function(req, res) {
  FB.setAccessToken(req.body.fb_token);
  FB.api('me/', { fields: ['id'] }, function (fb_res) {
    if(!fb_res || fb_res.error) {
      console.log(!fb_res ? 'error occurred' : fb_res.error);
      res.json({ messsage: !fb_res ? 'error occurred' : fb_res.error });
      return;
    }
    User.findById(fb_res.id).then(existing_user => {
      if (existing_user == null) {
        User.create({
          fb_id: fb_res.id,
          fb_token: req.body.fb_token,
          firebase_token: req.body.firebase_token
        }).then(user => {
          res.json({ message: 'User Created', req: req.body, user: user });
        });
      } else {
        existing_user.fb_token = req.body.fb_token;
        existing_user.firebase_token = req.body.firebase_token;
        existing_user.save().then(() => {}); 
        res.json({ message: 'User Updated', req: req.body, user: existing_user });
      }
    });
  });
});

module.exports = router;
