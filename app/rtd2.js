//
// RTD2 - Twitter bot that tweets about the most popular github.com news
// Also makes new friends and prunes its followings.
//
var Bot = require("./bot")
, config1 = require("../config1");
 
var bot = new Bot(config1);
 
console.log('RTD2: Running.');

bot._followers = {};
 
//get date string for today's date (e.g. 2011-01-01)
function datestring () {
  var d = new Date(Date.now() - 5*60*60*1000); //est timezone
  return d.getUTCFullYear() + "-" + 
         (d.getUTCMonth() + 1) + "-" + 
         d.getDate();
};
 
setInterval(function() {
  
  
  bot.twit.get("followers/ids", function(err, reply) {
    if(err) return handleError(err);

    
    bot._followers = reply;
    console.log("\n# followers:" + reply.ids.length.toString());
  });

  var rand = Math.random();
 
  if(rand <= 0.75) { //  make a friend
    bot.mingle();
  } else if(rand <= .85) {  // do a targeted follow
    var params = {
        q: "#datavisualization"
      , since: datestring()
      , result_type: "mixed"
    };
 
    bot.searchFollow(params, function(err, reply) {
      if(err) return handleError(err);
 
      var name = reply.screen_name;
      console.log("\nSearchFollow: followed @" + name);
    });
  } else if(false /*rand <= .90*/) {  // retweet
    var params = {
        q: "#datavisualization"
      , since: datestring()
      , result_type: "mixed"
    };
 
    bot.retweet(params, function(err, reply) {
      if(err) return handleError(err);
 
      console.log("\nRetweet: retweeted response: " + reply.id);
    });
  } else if(false /*rand <= .95*/) {  // favorite
    var params = {
        q: "#datavisualization"
      , since: datestring()
      , result_type: "mixed"
    };
 
    bot.favorite(params, function(err, reply) {
      if(err) return handleError(err);
 
      console.log("\nFavorite: favorited response: " + reply.id);
    });
  } else { 
   /*                //  prune a friend
    bot.prune(function(err, reply) {
      if(err) return handleError(err);
 
      var name = reply.screen_name
      console.log("\nPrune: unfollowed @"+ name);
    });
*/
  }
}, 6000);
 
function handleError(err) {
  console.error("response status:", err.statusCode);
  console.error("data:", err.data);
}
