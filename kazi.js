/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require('./lib/Botkit.js')
var os = require('os');
var request = require('request');
var spawn = require('child_process').spawn;

var controller = Botkit.slackbot({
  debug: false,
});

var bot = controller.spawn(
  {
    token:process.env.token
  }
).startRTM();


controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'kazibear',
  },function(err,res) {
    if (err) {
      bot.log("Failed to add emoji reaction :(",err);
    }
  });


  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+"!!");
    } else {
      bot.reply(message,"Hello.");
    }
  });
})


controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot,message) {
  var matches = message.text.match(/call me (.*)/i);
  var name = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,"Got it. I will call you " + user.name + " from now on.");
    })
  })
});

controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function(bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Your name is " + user.name);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  })
});

controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':kazibear: I am a bot named <@' + bot.identity.name +'>. I have been running for ' + uptime + ' on ' + hostname + ".");

});

controller.hears(['help', 'how does this work', 'what is bambu', 'how can I use this', 'how can I use you'], 'direct_message,direct_mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {
        convo.ask("I'm the Bambu mascot robot.  I can explain how our Slack integration works.  Would you like hear more?", [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say("Type `/bambu_read` to see your top Bambu stories.");
                    convo.say("Type `/bambu_draft [url]` to suggest a story for curation.");
                    convo.say("Type `/bambu_fact` to hear a random fact.");
                    convo.stop();
                }
            },
            {
                pattern: bot.utterances.no,
                callback: function(response, convo) {
                    convo.say("Well alrightie then!");
                    convo.stop();
                }
            }
        ]);

    });

});

controller.hears(['wumpus'], 'direct_message', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        convo.ask("Wanna play Hunt the Wumpus?", [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say("Type `quit` to quit.");
                    var wumpus = spawn('wumpus');
                    

                }
            },
            {
                pattern: bot.utterances.no,
                callback: function(response, convo) {
                    convo.say("Well alrightie then!");
                    convo.stop();
                }
            }
        ]);

    });

});

controller.hears(['^.*customer ["\u201c](.+?)["\u201d].*$'],'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'One sec!');
    var customerRegexp = /^.*customer ["\u201c](.+?)["\u201d].*$/g
    var customerString = customerRegexp.exec(message.text)[1];
    bot.reply(message, 'Looking for customers like "' + customerString + '".');

    request('http://localhost:9000/kazi/customer?customer_name=' + encodeURIComponent(customerString), function(error, response, body) {
        bot.reply(message, body);
    });
});


controller.hears(['^.*user ["\u201c]<.*\|(.+?)>["\u201d].*$'],'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'One sec!');
    var userRegexp = /^.*user ["\u201c]<.*\|(.+?)>["\u201d].*$/g
    var userString = userRegexp.exec(message.text)[1];
    bot.reply(message, "Checking the user email directory.");

    request('http://localhost:9000/kazi/user?email=' + encodeURIComponent(userString), function(error, response, body) {
        if (!error) {
            bot.reply(message, body);
        }
    });
});




function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}
