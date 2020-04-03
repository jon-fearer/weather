const AWS = require('aws-sdk');
const fs = require('fs');


const getFiles = () => {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: 'us-east-1',
  });

  const params = {
    Bucket: 'weather-denver',
    Key: 'denver-weather-2018-08-18T19:00:26.000Z.csv',
  };

  const getObjectPromise = s3.getObject(params).promise();

  getObjectPromise.then((data) => {
    fs.writeFile('data/denver-weather-2018-08-18T19:00:26.000Z.csv',
      data.Body,
      'utf-8',
      (err) => {
        if (err) throw err;
      });
  });
};

getFiles();
