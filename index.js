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
var firebaseConfig = {
    apiKey: "AIzaSyA5PHbaSMs2beKDLsUZc9nuLdqJT8QTiDw",
    authDomain: "yasin-bot.firebaseapp.com",
    databaseURL: "https://yasin-bot.firebaseio.com",
    storageBucket: "",
  };
var firebaseStorage = require('botkit-storage-firebase')({
  firebase_uri: 'https://yasin-bot.firebaseio.com'
});
var controller = Botkit.slackbot({
  storage: firebaseStorage,
  // debug:true
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


// controller.hears(['hello'], ['direct_message','direct_mention','mention','ambient'], function(whichBot, message) {
//   whichBot.reply(message, 'Did you say my name?');
// });

// controller.on('ambient', function(bot, message) {
//     bot.reply(message,{
//       text: "I'm a hungry panda",
//       username: "Panda Luigi",
//       icon_emoji: ":panda_face:"
//     });
// });

// var approves = {
//   pizza: "fuck yes",
// };

// Test DB
var approveDB = {
  id: 'approvals',
  items: {
  }
};

// TODO: Setup an init that creates the firebase DB
// if (getDB() ==)

function getDB () {
  controller.storage.teams.get('approvals', function(err,user_data) {
    approveDB.items = user_data.items;
  });
}

// var makeDB = new Promise(function(resolve, reject) {
//   controller.storage.teams.get('make', function(err,user_data) {
//     return user_data;
//   });
// });

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

get(dbName).then(function(user_data) {
  console.log("Success");
  dbContent = user_data;
  console.log(dbContent);
}, function(error){
  console.error("Failed", error);
  console.log("Creating new database for ", dbName);
  createDB(dbName);
});





// var makeDB = controller.storage.teams.get('make', function(err,user_data) {
//   console.log(user_data);
//   return user_data;
//
// });

// if (makeDB === null) {
//   console.log('it is null');
// }

// if user_data = null create database

// console.log(makeDB);


// console.log(approveDB);


//
// Get firebase DB
// User asks Does Yasin approve of cakes
// Bot conversation is started
// Look inside firebase DB object
// If item is in DB object reply with value
// If item not in DB

controller.hears('Does Yasin approve of (.*)',['ambient'], function(bot, message) {
  getDB();
  var item = message.match[1];

  bot.startConversation(message,function(err,convo) {

    if (!(approveDB.items[item])) {

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
                  // TODO: Figure out how to save this new approval out to a variable, then push that to firebase once the conversation is over
                  approves[item] = message.text;
                  console.log(approves);
                  convo.say('All added!');
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
      bot.reply(message, approveDB.items[item]);
      convo.stop();
    }

  });




});
