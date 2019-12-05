var mysql = require('mysql');
var dateformat = require('dateformat');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});


var connection = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: ''
});

connection.connect();

connection.query('select * from DailyWeather;', function (error, results, fields) {
  if (error) throw error;
  for (let i = 0; i < results.length; i++) {
    processData(results[i]);
  }
});

async function processData(record) {
    var s3 = new AWS.S3();
    const fileDf = 'yyyy-mm-dd';
    const dataDf = 'yyyy-mm-dd HH:MM:ss';
    var fileName = `denver-weather-${dateformat(record.Rundate, fileDf)}.csv`;
    var csvWriter = createCsvWriter({
        path: './'+fileName,
        header: [
            {id: 'pk', title: 'DailyWeatherId'},
            {id: 'rd', title: 'RunDate'},
            {id: 'city', title: 'City'},
            {id: 'temp', title: 'Temperature'},
            {id: 'desc', title: 'Description'},
            {id: 'ws', title: 'WindSpeed'}
        ]
    });
    var singleRecord = [
        {pk: record.DailyWeatherId,
         rd: dateformat(record.Rundate, dataDf),
         city: record.City,
         temp: record.Temperature,
         desc: record.Description,
         ws: record.WindSpeed}
    ];
    await csvWriter.writeRecords(singleRecord);
    var stream = fs.createReadStream(csvWriter._path);
    var params = {Bucket: 'weather-denver',
                  Key: fileName,
                  Body: stream};
    await s3.upload(params, (err, data) => {
      if (err) throw err;
    });
    fs.unlink(fileName, (err) => {
      if (err) throw err;
    });
}

connection.end();
