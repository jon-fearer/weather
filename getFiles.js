var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var fs = require('fs');


var getFiles = function() {
  var s3 = new AWS.S3({apiVersion: '2006-03-01'});
  var params = {
    Bucket: 'weather-denver',
    Key: 'denver-weather-2018-08-18T19:00:26.000Z.csv'
  };
  var getObjectPromise = s3.getObject(params).promise();
  getObjectPromise.then(data => {
    console.log(data);
    // fs.writeFile('data/denver-weather-2018-08-18T19:00:26.000Z.csv',
    //              data.Body,
    //              'utf-8',
    //              err => {
    //                if (err) throw err;
    //              });
  });
};

getFiles();
