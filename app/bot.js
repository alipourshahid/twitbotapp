//
//  Bot
//  class for performing various twitter actions
//
var Twit = require('../lib/twitter');
var _usc = require('../node_modules/underscore');
var colors = require('../node_modules/colors');  

var _keywords = [
    'visualization', 
    'data',
    'agile', 
    'leadership', 
    'analytics', 
    'javascript', 
    'viz', 
    'business intelligence', 
    'scrum', 
    'kanban', 
    'founder', 
    'software', 
    'd3'];

var Bot = module.exports = function(config) { 
  this.twit = new Twit(config);
};


Bot.prototype.noneFollowersIds = [];
Bot.prototype.pruneCandidates = [];
Bot.prototype.friendCandidates = [];
Bot.prototype.followers = []; 

//
//  post a tweet
//
Bot.prototype.tweet = function (status, callback) {
  if(typeof status !== 'string') {
    return callback(new Error('tweet must be of type String'));
  } else if(status.length > 140) {
    return callback(new Error('tweet is too long: ' + status.length));
  }
  this.twit.post('statuses/update', { status: status }, callback);
};

//
//  choose a random friend of one of your followers, and follow that user
//
Bot.prototype.mingle = function () {
  var self = this;

  if (self.friendCandidates.length > 0){
    console.log('******Remaining candidate list is: ' + self.friendCandidates.length);
    self.evaluateFriendCandidates();
  } 
  else if (self.followers && self.followers.length > 0) {
       self.findFriendsOfFollower();
  }
  else {
    console.log('=====Yaay went through all your friends friends once.... now one more time!======' .red);
    this.twit.get('followers/ids', function(err, reply) {
        if(err) { return self.reportMingled(err); }
        
        self.followers = reply.ids
        self.findFriendsOfFollower();


      })
  }
};

Bot.prototype.findFriendsOfFollower = function(){

        console.log('=====There are no candidates left, need to look for new ones.======' .yellow);

        var self = this;

        followerId  = _usc.first(self.followers);
        self.followers = _usc.rest(self.followers);
        console.log('this is the user that we will look through his friend: ' + followerId);

        self.twit.get('friends/ids', { user_id: followerId }, function(err, reply) {
          if(err) { return self.reportMingled(err); }
          
          self.friendCandidates = reply.ids
          self.evaluateFriendCandidates();
        })
}

Bot.prototype.evaluateFriendCandidates = function(){
        var self = this;

        var firstHundred;
        if (self.friendCandidates.length > 99){
          firstHundred = _usc.first(self.friendCandidates, 99);
          self.friendCandidates = _usc.rest(self.friendCandidates, 99);            
        } else {
          firstHundred = self.friendCandidates;
          self.friendCandidates = [];
        }

        self.twit.get('users/lookup', { user_id: firstHundred }, function (err, reply){
            
          var goodMatch = 0;
          var noMatch = 0; 
          
          console.log('### searching through ' + reply.length + ' users to find friend candidate');
          for (var i = 0; i < reply.length; i++ ){
            var target = reply[i].id;
            var name = reply[i].screen_name;
            var description = reply[i].description;
            if (shouldFollow(reply[i])) {
              console.log('found one!' .green);
              console.log('user: ' + reply[i].screen_name);
              goodMatch++;
              self.twit.post('friendships/create', { id: target }, self.reportMingled);
            } else {
              noMatch++;
              //console.log('-user: ' + name + ' is not a good candidate to follow');

            }

          }
            console.log("found: " + goodMatch + " good matches and: " + noMatch + " no match.");

        });
}

Bot.prototype.reportMingled = function(err, reply) {
      if(err) {
        console.log(err.message);
      } else {
      var name = reply.screen_name;
      console.log("\nMingle: followed @" + name);        
      }

}
//
//  prune your followers list; unfollow a friend that hasn't followed you back
//
Bot.prototype.prune = function (callback) {
  var self = this;
  
  
  if (self.pruneCandidates && self.pruneCandidates.length > 0){
    var candidate = self.pruneCandidates.splice(0, 1);
    //console.log(candidate[0]);

    console.log('There are:' + self.pruneCandidates.length + 'prune candidates on the list' .red);

    var target = candidate[0].id;
    var target_screenName = candidate[0].screen_name;
    console.log(target_screenName + ' is going to be removed');
    console.log('Followers count: ' + candidate[0].followers_count);
    console.log('description: ' + candidate[0].description);
    
    self.twit.post('friendships/destroy', { id: target }, callback);  

  } else if (self.noneFollowersIds && self.noneFollowersIds.length > 0){
    console.log('Still have: ' + self.noneFollowersIds.length + " to go through");
    var candidatesId = self.noneFollowersIds.splice(0, 99);

    self.twit.get('users/lookup', { user_id: candidatesId }, function (err, reply){
          for (var i = 0; i < reply.length; i++ ){
            var target = reply[i].id;
            var name = reply[i].screen_name;
            var description = reply[i].description;
            if (shouldNotFollow(reply[i])) {
              console.log('found one friend to be removed' .green);
              console.log('user: ' + reply[i].screen_name);
              self.pruneCandidates.push(reply[i]);
               
            } 
          }
        }
        ); 

  }else{
    this.twit.get('followers/ids', function(err, reply) {
        if(err) return callback(err);
        
        var followers = reply.ids;
        
        self.twit.get('friends/ids', function(err, reply) {
            if(err) return callback(err);

            var friends = reply.ids
              , pruned = false;
            
            self.noneFollowersIds = findNoneFollowersIds(friends, followers);
            console.log(self.noneFollowersIds);
            console.log('we found ' + self.noneFollowersIds.length + " pruneCandidates");
        });
  });
  } 
};

Bot.prototype.searchFollow = function (params, callback) {
  var self = this;
 
  self.twit.get('search/tweets', params, function (err, reply) {
    if(err) return callback(err);
 
    var tweets = reply.statuses;
    var target = randIndex(tweets).user.id_str;
 
    self.twit.post('friendships/create', { id: target }, callback);
  });
};

//
// retweet
//
Bot.prototype.retweet = function (params, callback) {
  var self = this;
 
  self.twit.get('search/tweets', params, function (err, reply) {
    if(err) return callback(err);
 
    var tweets = reply.statuses;
    var randomTweet = randIndex(tweets);
 
    self.twit.post('statuses/retweet/:id', { id: randomTweet.id_str }, callback);
  });
};
 
//
// favorite a tweet
//
Bot.prototype.favorite = function (params, callback) {
  var self = this;
 
  self.twit.get('search/tweets', params, function (err, reply) {
    if(err) return callback(err);
 
    var tweets = reply.statuses;
    var randomTweet = randIndex(tweets);
 
    self.twit.post('favorites/create', { id: randomTweet.id_str }, callback);
  });
};


function randIndex (arr) {
  var index = Math.floor(arr.length*Math.random());
  return arr[index];
};

function findNoneFollowersIds (friends, followers) {
  var noneFollowersIds = [];

  console.log("followers: ");
  console.log(followers);
  console.log("number of followers: ");
  console.log(followers.length);
  console.log("number of friends: ");
  console.log(friends.length);
  console.log("Expected prune candidates: ");
  console.log(friends.length - followers.length);

  noneFollowersIds = _usc.difference(friends, followers);

  return noneFollowersIds;
}

function shouldFollow (user){
    var sDescription = user.description;
    //console.log("shouldFollow is called with:");
    //console.log(sDescription);
    if (user.following || user.screen_name == 'ali_pourshahid'){
      console.log('%%%%already following or found yourself: '+ user.screen_name);
      return false;
    }
    for (var i = 0; i < _keywords.length; i++){
      if (sDescription.toLowerCase().indexOf(_keywords[i])>0){
        return true; 
      }
      return false; 
    }
}

function shouldNotFollow (user){

var _whitelist = ['diveloop', 'markpriatel'];

 //console.log('user.followers_count: ' + user.followers_count);
 if(user.followers_count<400 && _whitelist.indexOf(user.screen_name)==-1){
  return true;
 }
}

