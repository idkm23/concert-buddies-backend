var modules = require('../models');
var User_Attending_Event = modules.User_Attending_Event;
var express = require('express');
var router = express.Router();
var FB = require('fb');

/* FETCH JOINED EVENTS FOR USER via GET
 * example url: /events/12341
 **/
router.route('/list/:fb_user_id')
  .get(function(req, res) {
    User_Attending_Event.findAll({
      attributes: ['event_id'],
      where: { fb_user_id: req.params.fb_user_id }
    }).then(events => {
      var extracted_events = [];
      events.forEach(function(event) {
        extracted_events.push(event["event_id"]);
      });
      res.json(extracted_events);
    });
  });

/* JOIN EVENT via POST
 * example url: /events/join/
 **/
router.post('/join', function(req, res) {
  FB.setAccessToken(req.body.fb_token);
  FB.api('me/', { fields: ['id'] }, function (fb_res) {
    if(!fb_res || fb_res.error) {
      console.log(!fb_res ? 'error occurred' : fb_res.error);
      res.json({ messsage: !fb_res ? 'error occurred' : fb_res.error });
      return;
    }

    var next_seq_id = 0;
    // first check if the user is already in the event
    User_Attending_Event.findAll({
      where: {
        event_id: req.body.event_id,
        fb_user_id: fb_res.id 
      }
    }).then(user_attending_events => {
      if (user_attending_events.length != 0) {
        res.json({
          message: 'Error: user \''
            + fb_res.id + '\' is already in event \''
            + req.body.event_id + '\'',
          req: req.body
        });

      // find the next seq_id and add it to the table
      } else {
        User_Attending_Event.findAll({
          attributes: ['seq_id'],
          order: [ ['seq_id', 'DESC'] ],
          where: { event_id: req.body.event_id },
          limit: 1
        }).then(user_attending_event => {
          if (user_attending_event.length != 0) {
            next_seq_id = +user_attending_event[0]["seq_id"];
            next_seq_id += 1;
          }

          createUAE(res, req, fb_res.id, next_seq_id);
        });
      }
    });
  });
});

function createUAE(res, req, fb_user_id, seq_id) {
  User_Attending_Event.create({
    fb_user_id: fb_user_id,
    event_id: req.body.event_id,
    seq_id: seq_id,
  }).then(user_attending_event => {
    res.json({
      message: 'User Joined Event',
      req: req.body,
      user_attending_event: user_attending_event });
  });
}

/* LEAVE EVENT via POST
 * example url: /events/leave/
 **/
router.post('/leave', function(req, res) {
  FB.setAccessToken(req.body.fb_token);
  FB.api('me/', { fields: ['id'] }, function (fb_res) {
    if(!fb_res || fb_res.error) {
      console.log(!fb_res ? 'error occurred' : fb_res.error);
      res.json({ messsage: !fb_res ? 'error occurred' : fb_res.error });
      return;
    }

    // find user-event pair
    User_Attending_Event.findAll({
      where: {
        event_id: req.body.event_id,
        fb_user_id: fb_res.id 
      }
    }).then(user_attending_events => {
      if (user_attending_events.length == 0) {
        res.json({
          message: 'Error: user \''
            + fb_res.id + '\' is not in event \''
            + req.body.event_id + '\'',
          req: req.body
        });

      // remove it
      } else {
        user_attending_events.forEach(function(uae) {
          uae.destroy();
        });
        res.json({
          message: 'Success: user \''
            + fb_res.id + '\' has left event \''
            + req.body.event_id + '\'',
          req: req.body
        });
      }
    });
  });
});

module.exports = router;
