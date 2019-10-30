var express = require('express');
var router = express.Router();
var rp = require('request-promise');
const accountSid = 'ACfff4a3f0f78b7d752072f2ef71233fc8';
const authToken = '599caa7b5283932815023fda16ef328a';
const client = require('twilio')(accountSid, authToken);
var moment = require('moment');
const db = require('monk')('mongodb://milanpasschier:detering1@bol-shard-00-00-9sjag.mongodb.net:27017,bol-shard-00-01-9sjag.mongodb.net:27017,bol-shard-00-02-9sjag.mongodb.net:27017/test?ssl=true&replicaSet=bol-shard-0&authSource=admin&retryWrites=true&w=majority');
var date = moment().format("YYYY-MM-DD");
const cheerio = require('cheerio')

/* GET home page. */
router.get('/', function(req, res, next) {
  
  res.render('index', {title: 'Verbinding maken met WhatsApp'});
  
});


router.get('/support', function(req, res, next) {
  
  
var options = {
  method: 'get',
  uri: 'https://www.bol.com/nl/p/fudge-hair-shaper-wax-75-gr/9200000020320791/prijsoverzicht/?filter=all&sort=price&sortOrder=asc',
  headers: {
    'Host': 'www.bol.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  }
};
 
rp(options)
  .then(function (body) {
  
    var sellers = [];

    const $ = cheerio.load(body)

    $('#offers li.media').each(function(i, elem) {

      var seller = {
        name: $(this).find("p.nosp strong").text().trim(),
        rating: $(this).find(".seller-rating").text().trim(),
        product: {
          price: $(this).find(".product-prices__bol-price").text().trim(),
          fee: $(this).find(".product-additional-fee").text().trim()
        }
      }

      sellers.push(seller)

    });

    sellers.sort((a, b) => (b.rating > a.rating) ? 1 : -1)

    console.log(sellers);
  
  }).catch(function (err) {
    // API call failed...
  });

  res.render('support/index', {title: 'Support'});
  
});

module.exports = router;
