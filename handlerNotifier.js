var AWS = require('aws-sdk');
var dateformat = require('dateformat');
AWS.config.update({region:'us-east-1'});
const request = require('request');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');


exports.lambdaHandler = function(event, context) {

  var dataPromise = getData();
  dataPromise.then(data => useData(data), errHandler);

};


var errHandler = function(err) {
  console.log(err);
};


var getData = function() {
  const url = 'http://dataservice.accuweather.com/currentconditions/v1/347810';
  const apiKey = process.env.apiKey;
  const urlParams = {'apikey': apiKey, 'details': 'true'};

  return new Promise(function(resolve, reject) {
    request({url: url, qs: urlParams}, function(err, response, body) {
      if (err) {
        reject(err);
      } else {
        const response = JSON.parse(body)[0];
        resolve([parseInt(response.Temperature.Imperial.Value),
                 response.WeatherText.toLowerCase(),
                 parseInt(response.Wind.Speed.Imperial.Value),
                 parseInt(response.RealFeelTemperature.Imperial.Value),
                 response.MobileLink]);
      }
    });
  });
};


var useData = function(data) {
  var sns = new AWS.SNS();

  var message = `Right now in Denver it's ${data[0]}°F and ${data[1]}, ` +
                `with winds of ${data[2]} miles per hour. The RealFeel ` +
                `temperature is ${data[3]}°F.`;

  const params = {
    Message: message,
    TopicArn: 'arn:aws:sns:us-east-1:528165410097:Weather'
  };

  sns.publish(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log(data);
    }
  });

};


// if(require.main == module)
//   process.env.apiKey = JSON.parse(fs.readFileSync('apiKey.json', 'utf8')).apiKey;
//   process.env.tmpLoc = './';
// 	exports.lambdaHandler('','');
