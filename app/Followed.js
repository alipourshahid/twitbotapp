
var mongoose = require('mongoose');

var FollowedSchema = new mongoose.Schema({
    id: String,
    screen_name: String,
    dateFollowed: { type: Date, default: Date.now },
    followedBack: { type: Boolean, default: false },
    followedBackDate: Date
  });

FollowedSchema.methods.saved = function () {
  var savedmsg = " Handle: " + this.screen_name + " ID: " +  this.id + " User has been followed on: " + this.dateFollowed;
  console.log(savedmsg);
}

mongoose.model('Followed', FollowedSchema);