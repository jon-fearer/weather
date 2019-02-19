var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const request = require('request');

exports.lambdaHandler = function(event, context) {
  const url = 'http://dataservice.accuweather.com/currentconditions/v1/347810';
  const apiKey = '';
  const urlParams = {'apikey': apiKey, 'details': 'true'};

  var temp;

  request({url: url, qs: urlParams}, function(err, response, body) {
    if (err) {
      console.log(err);
      return;
    };
    temp = JSON.parse(body)[0].Temperature.Imperial.Value;
  });

  var sns = new AWS.SNS();

  var params = {
    Message: 'the temp is ' + temp,
    TopicArn: 'arn:aws:sns:us-east-1:528165410097:Weather'
  }

  sns.publish(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log(data);
    };
  });

};

if(require.main == module)
	exports.lambdaHandler('','')
