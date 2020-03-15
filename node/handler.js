const AWS = require('aws-sdk');
const dateformat = require('dateformat');
const fs = require('fs');
const request = require('request');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const getWeatherData = () => {
  const url = process.env.WEATHER_URL;
  const apiKey = process.env.WEATHER_API_KEY;
  const urlParams = { apikey: apiKey, details: 'true' };

  return new Promise(((resolve, reject) => {
    request({ url, qs: urlParams }, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
        const httpResponse = JSON.parse(body)[0];

        resolve([
          parseInt(httpResponse.Temperature.Imperial.Value, 10),
          httpResponse.WeatherText.toLowerCase(),
          parseInt(httpResponse.Wind.Speed.Imperial.Value, 10),
          parseInt(httpResponse.RealFeelTemperature.Imperial.Value, 10),
          httpResponse.MobileLink,
        ]);
      }
    });
  }));
};


const sendNotification = (sns, data) => {
  const message = `Right now in Denver it's ${data[0]}°F and ${data[1]}, `
                + `with winds of ${data[2]} miles per hour. The RealFeel `
                + `temperature is ${data[3]}°F.`;

  const params = {
    Message: message,
    TopicArn: process.env.SNS_TOPIC_ARN,
  };

  return new Promise((resolve, reject) => {
    sns.publish(params, (err, snsData) => {
      if (err) {
        reject(err);
      }

      resolve(snsData);
    });
  });
};


const persistToS3 = (s3, data) => {
  const dataTs = dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss', true);

  const fileName = `denver-weather-${dataTs}.csv`;

  const csvWriter = createCsvWriter({
    path: `${process.env.TMP_LOC}${fileName}`,
    header: [
      { id: 'pk', title: 'DailyWeatherId' },
      { id: 'rd', title: 'RunDate' },
      { id: 'city', title: 'City' },
      { id: 'temp', title: 'Temperature' },
      { id: 'desc', title: 'Description' },
      { id: 'ws', title: 'WindSpeed' },
    ],
  });

  const records = [
    {
      pk: -1,
      rd: dataTs,
      city: 'Denver',
      temp: data[0],
      desc: data[1],
      ws: data[2],
    },
  ];

  return new Promise((resolve, reject) => {
    csvWriter.writeRecords(records)
      .then(() => {
        const stream = fs.createReadStream(csvWriter._path);

        const params = {
          Bucket: process.env.S3_BUCKET,
          Key: fileName,
          Body: stream,
        };

        s3.upload(params, (err, s3Data) => {
          if (err) {
            reject(err);
          }

          resolve(s3Data);
        });
      });
  });
};


const notificationHander = () => {
  getWeatherData().then((data) => sendNotification(
    new AWS.SNS({ region: process.env.PRIMARY_REGION }),
    data,
  ));
};


const s3handler = () => {
  getWeatherData().then((data) => persistToS3(
    new AWS.S3({ region: process.env.PRIMARY_REGION }),
    data,
  ));
};


module.exports = {
  getWeatherData,
  sendNotification,
  persistToS3,
  notificationHander,
  s3handler,
};
