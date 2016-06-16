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

var Botkit = require('botkit');
var controller = Botkit.slackbot({
  debug:true
});
var bot = controller.spawn({
  token: process.env.SLACKBOT_TOKEN
});
bot.startRTM(function(error, whichBot, payload) {
  if (error) {
    throw new Error('Could not connect to Slack');
  }
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

var approves = {
  "pizza": "yes"
};

controller.hears(['hello'], ['ambient'], function(bot, message) {

  bot.startConversation(message,function(err,convo) {

    convo.ask('What\'s your favourite thing about' + approves.pizza, function(response,convo) {

      convo.say('Cool, me to. I also like: ' + response.text);
      convo.next();

    });

  });
});
