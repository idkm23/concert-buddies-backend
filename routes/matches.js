const Sequelize = require('sequelize');
var modules = require('../models');
var User_Attending_Event = modules.User_Attending_Event;
var User = modules.User;
var Next_User = modules.Next_User;
var Liked_Users = modules.Liked_Users;
var Matches = modules.Matches;
var express = require('express');
var router = express.Router();
var FB = require('fb');

/* GET 5 POTENTIAL MATCH PROFILES FOR USER via GET
 * example url: /matches/getbatch?fb_token=AWJEFWE&event_id=owiejfao
 **/
router.route('/get_potential_matches')
  .get(function(req, res) {
    var fb_id;
    var next_seq;

    // get the user's fb id
    User.findAll({
      attributes: ['fb_id'],
      where: { fb_token: req.query.fb_token }
    })

    // get the user's next seq id for the event
      .then(users => {
        if (users.length != 0) {
          fb_id = users[0].fb_id;
          return Next_User.findAll({
            attributes: ['next_seq_id'],
            where: {
              fb_id: fb_id,
              event_id: req.query.event_id
            }
          });
        } else {
          throw new Error(
            'Error: user does not exist for token \''
              + req.query.fb_token + '\', maybe update your user\'s token?');
        }
      })

    // get the potential matches
      .then(next_users => {
        if (next_users != 0) {
          next_seq = +next_users[0].next_seq_id;
          return User_Attending_Event.findAll({
            attributes: ['fb_user_id'],
            where: { 
              fb_user_id: {
                [Sequelize.Op.not]: fb_id
              },
              event_id: req.query.event_id,
              seq_id: {
                [Sequelize.Op.gte]: next_seq
              },
            },
            order: [
              ['seq_id', 'ASC'],
            ],
            limit: 5
          });
        } else {
          throw new Error(
            'Error: no next_user entry found for the event-user pair. Has this '
              + 'user joined the event?');
        }
      })

    // just got all the users
      .then(potential_users => {
        console.log(potential_users);
        var profiles = [];
        var profile_count = potential_users.length;
        var i = 0;
        var attempts = 0;
        potential_users.forEach(function(potential_user) {
          var iter_num = i;
          i += 1;

          var fb_id = potential_user['fb_user_id'];
          User.findById(fb_id, {}).then(user => {
            if (user == null) {
              profiles[iter_num] = {
                id: fb_id,
                message: "error: couldn't find token for this id, is this user in the database?"
              };
              attempts += 1;
              if (attempts == profile_count) {
                res.json(profiles);
              }
            } else {
              FB.setAccessToken(user.fb_token);
              FB.api('me/', {
                fields: ['id', 'name', 'about', 'birthday', 'picture.width(640)']
              }, 
                function (fb_res) {
                  if(!fb_res || fb_res.error) {
                    console.log(!fb_res ? 'error occurred' : fb_res.error);
                    profiles.push({
                      id: fb_id,
                      message: !fb_res ? 'error occurred' : fb_res.error
                    });
                  } else {
                    profiles[iter_num] = fb_res;
                  }
                  attempts += 1;
                  if (attempts == profile_count) {
                    res.json(profiles);
                  }
                });
            }
          });
        });
      })
      .catch(err => {
        res.json({
          message: err.message,
          req: req.params
        });
      });
  });

/* VOTE ON A PROFILE via POST 
 * example url: /matches/like
 **/
router.route('/like')
  .post(function(req, res) {
    var fb_id;
    var next_seq;
    var self_seq;

    // get the user's fb id
    User.findAll({
      attributes: ['fb_id'],
      where: { fb_token: req.body.fb_token }
    })

    // get the user's next seq id for the event
      .then(users => {
        if (users.length != 0) {
          fb_id = users[0].fb_id;
          return Next_User.findAll({
            attributes: ['next_seq_id'],
            where: {
              fb_id: fb_id,
              event_id: req.body.event_id
            }
          });
        } else {
          throw new Error(
            'Error: user does not exist for token \''
              + req.body.fb_token + '\', maybe update your user\'s token?');
        }
      })

      .then(next_users => {
        if (next_users != 0) {
          next_seq = +next_users[0].next_seq_id;
          return User_Attending_Event.findAll({
            attributes: ['seq_id'],
            where: {
              fb_user_id: fb_id,
              event_id: req.body.event_id
            }
          });
        } else {
          throw new Error(
            'Error: no next_user entry found for the event-user pair. Has this '
              + 'user joined the event?');
        }
      })

    // get the potential matches
      .then(self_uae => {
        if (self_uae.length != 0) {
          self_seq = +self_uae[0].seq_id;

          User_Attending_Event.findAll({
            attributes: ['fb_user_id'],
            where: { 
              fb_user_id: {
                [Sequelize.Op.not]: fb_id
              },
              event_id: req.body.event_id,
              seq_id: {
                [Sequelize.Op.gte]: next_seq
              },
            },
            limit: 1
          }).then(liked_user => {
            if (liked_user.length != 0) {
              var new_seq = next_seq + 1;
              if (self_seq == next_seq || self_seq == next_seq+1) {
                new_seq += 1;
              }
              Next_User.update(
                { next_seq_id: new_seq },
                { where: { fb_id: fb_id, event_id: req.body.event_id }}
              ).then(() => {});
              if (req.body.like == 'false') {
                res.json({
                  message: 'Success, user \'' + fb_id
                    + '\' disliked the next user in the queue', 
                  req: req.body
                });
                return;
              }

              // add user to match table
              var liked_fb_id = liked_user[0]['fb_user_id'];
              Liked_Users.findAll({
                where: {
                  fb_id: liked_fb_id,
                  liked_fb_id: fb_id
                }
              }).then(is_match => {
                if(is_match.length != 0) {
                  // TODO: signal app somehow??
                  Matches.bulkCreate([
                    { fb_id: fb_id, matched_fb_id: liked_fb_id },
                    { fb_id: liked_fb_id, matched_fb_id: fb_id }
                  ]);
                }
              });
              
              Liked_Users.create({
                fb_id: fb_id,
                event_id: req.body.event_id,
                liked_fb_id: liked_fb_id
              }).then(liked_user => {
                res.json({
                  message: 'Success, user \'' + fb_id
                    + '\' liked user \'' + liked_fb_id + '\'',
                  req: req.body
                });
              });
            } else {
              res.json({
                message: 'Error: there are no more users in the concert queue to like!',
                req: req.body
              });
            }
          });
        } else {
          throw new Error(
            'Error: no User_Attending_Event entry found for the id. Has this '
              + 'user joined the event?');
        }
      })
      .catch(err => {
        res.json({
          message: err.message,
          req: req.body
        });
      });
  });

/* Get matches via GET 
 * example url: /matches/
 **/
router.route('/')
  .get(function(req, res) {
    var fb_id;

    // get the user's fb id
    User.findAll({
      attributes: ['fb_id'],
      where: { fb_token: req.query.fb_token }
    })

      .then(users => {
        if (users.length != 0) {
          fb_id = users[0].fb_id;
          return Matches.findAll({
            attributes: [
              [Sequelize.fn('DISTINCT', Sequelize.col('matched_fb_id')), 'matched_fb_id']
            ],
            where: {
              fb_id: fb_id
            }
          });
        } else {
          throw new Error(
            'Error: user does not exist for token \''
              + req.query.fb_token + '\', maybe update your user\'s token?');
        }
      })
      .then(matches_obj => {
        matches = [];
        matches_obj.forEach(function(match) {
          matches.push(match['matched_fb_id']);
        });
        res.json(matches);
      })
      .catch(err => {
        res.json({
          message: err.message,
          req: req.body
        });
      });

  });


module.exports = router;
