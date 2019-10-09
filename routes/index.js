var express = require('express');
var router = express.Router();
var rp = require('request-promise');
const accountSid = 'ACfff4a3f0f78b7d752072f2ef71233fc8';
const authToken = '599caa7b5283932815023fda16ef328a';
const client = require('twilio')(accountSid, authToken);
var moment = require('moment');
const db = require('monk')('mongodb://milanpasschier:detering1@bol-shard-00-00-9sjag.mongodb.net:27017,bol-shard-00-01-9sjag.mongodb.net:27017,bol-shard-00-02-9sjag.mongodb.net:27017/test?ssl=true&replicaSet=bol-shard-0&authSource=admin&retryWrites=true&w=majority');
const users = db.get('users');
var date = moment().format("YYYY-MM-DD");

/* GET home page. */
router.post('/', function(req, res, next) {
  
  var sender = req.body.From;
  var senderMessage = req.body.Body;
  var accountSID = req.body.AccountSid;
  
  var phoneNumber = sender.replace("whatsapp:", "");
  
  users.findOne({phoneNumber: phoneNumber}).then((doc) => {
    
    if (doc) {
      
      var user = doc;
      
      if (user.date != date) {
        
        var sessions = user.sessions++;
        
        var startChatOptions = {
          uri: 'https://chatr.bol.com/v1/p3/converse',
          method: 'POST',
          body: {"conversationId":null,"payload":{"contextData":{"deviceType":"DESKTOP","locale":"nl_NL","initializeConversationType":"Billie","abTests":[],"channel":"Billie","billieContext":{"delay":true,"width":1920,"height":622,"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0","location":"https://www.bol.com/nl/klantenservice/online-service","referrer":""}},"message":{"type":"BillieInit","label":"BillieInit","text":"BillieInit"}}},
          headers: {
            'Host': 'chatr.bol.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/json;charset=utf-8',
            'Origin': 'https://www.bol.com',
            'Connection': 'keep-alive',
            'Referer': 'https://www.bol.com/nl/klantenservice/online-service'
          },
          json: true
        };

        rp(startChatOptions).then(function (res) {  

          var conversationId = res.conversationId;
          var messages = res.messages['0'];

          var session = messages.payload.session;
          var user_id = messages.payload['user-id'];

          var chatDetails = {
            conversationId: conversationId,
            session: session,
            user_id: user_id
          }
          
          users.findOneAndUpdate({phoneNumber: phoneNumber}, { $set: { date: date, accountSID: accountSID, sessions: sessions, chatDetails: chatDetails } }).then((updatedDoc) => {

            var user = updatedDoc;

            chatFunction(user, senderMessage);

          })

        }).catch(function (err) {
          // API call failed...
        });
        
      } else {
        
        chatFunction(user, senderMessage);
        
      }
      
    } else {
  
      var user = {
        phoneNumber: phoneNumber,
        accountSID: accountSID,
        date: date,
        sessions: 1
      }
      
      var startChatOptions = {
        uri: 'https://chatr.bol.com/v1/p3/converse',
        method: 'POST',
        body: {"conversationId":null,"payload":{"contextData":{"deviceType":"DESKTOP","locale":"nl_NL","initializeConversationType":"Billie","abTests":[],"channel":"Billie","billieContext":{"delay":true,"width":1920,"height":622,"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0","location":"https://www.bol.com/nl/klantenservice/online-service","referrer":""}},"message":{"type":"BillieInit","label":"BillieInit","text":"BillieInit"}}},
        headers: {
          'Host': 'chatr.bol.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Content-Type': 'application/json;charset=utf-8',
          'Origin': 'https://www.bol.com',
          'Connection': 'keep-alive',
          'Referer': 'https://www.bol.com/nl/klantenservice/online-service'
        },
        json: true
      };

      rp(startChatOptions).then(function (res) {  

        var conversationId = res.conversationId;
        var messages = res.messages['0'];

        var session = messages.payload.session;
        var user_id = messages.payload['user-id'];
        
        user.chatDetails = {
          conversationId: conversationId,
          session: session,
          user_id: user_id
        }
      
        users.insert(user);

        console.log('User inserted!')

        chatFunction(user, senderMessage);

      }).catch(function (err) {
        console.log(err);
      });
      
    }
    
  })
  
  function chatFunction(user, senderMessage) {

      // get messages of initialized conversation
      var myTimer = setInterval(function(){ 

        var getMessagesOptions = {
          uri: 'https://chatr.bol.com/v1/p3/converse',
          method: 'POST',
          body: {"conversationId": user.chatDetails.conversationId,"payload":{"contextData":{"deviceType":"DESKTOP","locale":"nl_NL","initializeConversationType":"Billie","abTests":[],"channel":"Billie","billieContext":{"delay":false,"width":1920,"height":622,"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0","location":"https://www.bol.com/nl/klantenservice/online-service","referrer":"","session": user.chatDetails.session,"user-id": user.chatDetails.user_id}},"message":{"type":"GetMessages","label":"","text":""}}},
          headers: {
            'Host': 'chatr.bol.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/json;charset=utf-8',
            'Origin': 'https://www.bol.com',
            'Connection': 'keep-alive',
            'Referer': 'https://www.bol.com/nl/klantenservice/online-service'
          },
          json: true
        };

        rp(getMessagesOptions).then(function (res) {
          console.log(res)

          if (res.messages['0'].text != undefined) {
            
            var message = res.messages['0'].text.text['0'];
            
            // message transmission optimization
            
            if (message.indexOf('<a href="') >= 0) {
              message = message.replace('<a href="/g', "");
              message = message.replace(/".*?<\/a>/g, '');
            }
            
            console.log(message);
            
            client.messages.create({
             from: 'whatsapp:+14155238886',
             body: message,
             to: 'whatsapp:' + user.phoneNumber
            }).then(message => console.log(message.sid));

          } else {
            
            clearInterval(myTimer);
            
          }

        }).catch(function (err) {
          // API call failed...
        });

      }, 5000);

      var firstChatOptions = {
        uri: 'https://chatr.bol.com/v1/p3/converse',
        method: 'POST',
        body: {"conversationId": user.chatDetails.conversationId,"payload":{"contextData":{"deviceType":"DESKTOP","locale":"nl_NL","initializeConversationType":"Billie","abTests":[],"channel":"Billie","billieContext":{"delay":false,"width":1920,"height":622,"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0","location":"https://www.bol.com/nl/klantenservice/online-service","referrer":"","session":user.chatDetails.session,"user-id": user.chatDetails.user_id}},"message":{"text":senderMessage,"label":senderMessage,"type":"PostMessage"}}},
        headers: {
          'Host': 'chatr.bol.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Content-Type': 'application/json;charset=utf-8',
          'Origin': 'https://www.bol.com',
          'Connection': 'keep-alive',
          'Referer': 'https://www.bol.com/nl/klantenservice/online-service'
        },
        json: true
      };

      rp(firstChatOptions).then(function (res) {

        console.log(res.messages['0'])

      }).catch(function (err) {
        // API call failed...
      });
    
  }
  
});

module.exports = router;
