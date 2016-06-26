/**
 * Your slackbot token is available as the global variable:

process.env.SLACKBOT_TOKEN

 * When deployed to now.sh, the URL of your application is available as the
 * global variable:

process.env.NOW_URL

 * The URL is useful for advanced use cases such as setting up an Outgoing
 * webhook:
 * https://github.com/howdyai/botkit/blob/master/readme-slack.md#outgoing-webhooks-and-slash-commands
 *
 */

var fetch = require('node-fetch');
var Botkit = require('botkit');
var firebaseStorage = require('botkit-storage-firebase')({
  firebase_uri: 'https://yasin-bot.firebaseio.com'
});

var controller = Botkit.slackbot({
  storage: firebaseStorage,
});

var bot = controller.spawn({
  token: process.env.SLACKBOT_TOKEN
});

bot.startRTM(function(error, whichBot, payload) {
  if (error) {
    throw new Error('Could not connect to Slack');
  }
});

//Get Names of All Users
bot.api.users.list({},function(err,response) {
  obj = response.members;
  var names = Object.keys(obj).map(function (key) {
    var val = obj[key];
    return val.profile.real_name;
  });
});


// Name and setup database for approvals
var dbName = 'approvals';
var dbContent;

// Check FireBase to see if database already exists
function get(key) {
  return new Promise(function(resolve, reject) {
    controller.storage.teams.get(key, function(err,user_data) {
      if (user_data !== null) {
        resolve(user_data);
      }else {
        reject(Error("Collection not found"));
      }
    });
  });
}

// Create new FireBase database
function createDB(id) {
  database = {id: id,items: {0: '0'}};
  controller.storage.teams.save(database);
}

// Get content of database from FireBase or create new database
get(dbName).then(function(user_data) {
  dbContent = user_data;
  console.log("Success", dbContent);
}, function(error){
  console.error("Failed", error);
  console.log("Creating new database for ", dbName);
  createDB(dbName);
});

function updateDB(database){
  controller.storage.teams.save(database);
}

//Start Bot Controller
controller.hears('Does Yasin approve of (.*)',['ambient'], function(bot, message) {
  var item = message.match[1];

  bot.startConversation(message,function(err,convo) {

    if (!(dbContent.items[item])) {

      var requestURL = 'http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=' + item;

      fetch(requestURL).then(function(response) {

        return response.json();

      }).then(function(json) {
        var gifURL = json.data.image_url;

        bot.reply(message, {
          text: 'Yasin does not approve of ' + item,
          attachments : [
            {
              title: 'Yasin Dissaproves',
              image_url: gifURL
            }
          ]
        });

      });

      setTimeout(function () {
        convo.ask('Would you like to add ' + item + '?',[
          {
            pattern: bot.utterances.yes,
            callback: function(response,convo) {
              convo.ask('Great! What does Yasin think of ' + item + '?', function(message,convo) {
                  dbContent.items[item] = message.text;
                  updateDB(dbContent);
                  console.log('database updated');
                  convo.say(message.text + '! ' + item + ' has been added!');
                  convo.next();
                });
              convo.next();
            }

          },
          {
            pattern: bot.utterances.no,
            callback: function(response,convo) {
              convo.say('Ok! Well perhaps later.');
              convo.next();
              convo.stop();
            }
          },
          {
            default: true,
            callback: function(response,convo) {
              // just repeat the question
              convo.repeat();
              convo.next();
            }
          }
        ]);

      },3000);


    } else {
      bot.reply(message, dbContent.items[item]);
      convo.stop();
    }

  });

});
