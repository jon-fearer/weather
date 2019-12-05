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
  const dataTs = dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss', true);
  const fileName = `denver-weather-${dataTs}.csv`;
  const csvWriter = createCsvWriter({
      path: `${process.env.tmpLoc}${fileName}`,
      header: [
        {id: 'pk', title: 'DailyWeatherId'},
        {id: 'rd', title: 'RunDate'},
        {id: 'city', title: 'City'},
        {id: 'temp', title: 'Temperature'},
        {id: 'desc', title: 'Description'},
        {id: 'ws', title: 'WindSpeed'}
      ]
  });

  const records = [
      {pk: -1,
       rd: dataTs,
       city: 'Denver',
       temp: data[0],
       desc: data[1],
       ws: data[2]}
  ];

  csvWriter.writeRecords(records)
      .then(() => {
          var s3 = new AWS.S3();
          const stream = fs.createReadStream(csvWriter._path);
          var params = {Bucket: 'weather-denver',
                        Key: fileName,
                        Body: stream};
          s3.upload(params, function(err, data) {
            console.log(err, data);
          });
      });
};


// if(require.main == module)
//   process.env.apiKey = JSON.parse(fs.readFileSync('apiKey.json', 'utf8')).apiKey;
//   process.env.tmpLoc = './';
// 	exports.lambdaHandler('','');
