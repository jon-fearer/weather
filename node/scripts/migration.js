const mysql = require('mysql');
const dateformat = require('dateformat');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const AWS = require('aws-sdk');


const connection = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: '',
});

connection.connect();

connection.query('select * from DailyWeather;', (error, results) => {
  if (error) throw error;

  for (let i = 0; i < results.length; i += 1) {
    processData(results[i]);
  }
});

async function processData(record) {
  const s3 = new AWS.S3({ region: 'us-east-1' });
  const fileDf = 'yyyy-mm-dd';
  const dataDf = 'yyyy-mm-dd HH:MM:ss';
  const fileName = `denver-weather-${dateformat(record.Rundate, fileDf)}.csv`;

  const csvWriter = createCsvWriter({
    path: `./${fileName}`,
    header: [
      { id: 'pk', title: 'DailyWeatherId' },
      { id: 'rd', title: 'RunDate' },
      { id: 'city', title: 'City' },
      { id: 'temp', title: 'Temperature' },
      { id: 'desc', title: 'Description' },
      { id: 'ws', title: 'WindSpeed' },
    ],
  });

  const singleRecord = [
    {
      pk: record.DailyWeatherId,
      rd: dateformat(record.Rundate, dataDf),
      city: record.City,
      temp: record.Temperature,
      desc: record.Description,
      ws: record.WindSpeed,
    },
  ];

  await csvWriter.writeRecords(singleRecord);
  const stream = fs.createReadStream(csvWriter._path);
  const params = {
    Bucket: 'weather-denver',
    Key: fileName,
    Body: stream,
  };

  await s3.upload(params, (err) => {
    if (err) throw err;
  });

  fs.unlink(fileName, (err) => {
    if (err) throw err;
  });
}

connection.end();
