
var mongoose = require('mongoose');

var FriendSchema = new mongoose.Schema({
    id: String,
    followersCount: Number,
    followers: [{id: String}],
    date: { type: Date, default: Date.now }
  });

FriendSchema.methods.addFollowers = function(friend, follower) {
  this.followers.push(follower);
  this.save(friend);
};

FriendSchema.methods.saved = function () {
  var savedmsg = this.id + " users friends are being looked and the ID is saved in the database at: " + this.date;
  console.log(savedmsg);
}

mongoose.model('Friend', FriendSchema);