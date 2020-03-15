require('dotenv').config();
const AWSMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
const nock = require('nock');
const handlers = require('./handler');


beforeAll(() => {
  nock('http://dataservice.accuweather.com', {
    reqheaders: {
      host: 'dataservice.accuweather.com',
    },
  })
    .get('/currentconditions/v1/347810')
    .query({
      apikey: process.env.WEATHER_API_KEY,
      details: true,
    })
    .reply(200, [{
      Temperature: {
        Imperial: {
          Value: 50.38,
        },
      },
      WeatherText: 'Mostly cloudy',
      Wind: {
        Speed: {
          Imperial: {
            Value: 2.43,
          },
        },
      },
      RealFeelTemperature: {
        Imperial: {
          Value: 54.21,
        },
      },
      MobileLink: 'http://aweatherdomain.com',
    }]);

  AWSMock.setSDKInstance(AWS);

  const snsMockFn = (_params, cb) => {
    cb(null, 'mock called');
  };
  const s3MockFn = (_params, cb) => {
    cb(null, 'mock called');
  };

  AWSMock.mock('SNS', 'publish', snsMockFn);
  AWSMock.mock('S3', 'upload', s3MockFn);
});


afterAll(() => {
  nock.restore();
  AWSMock.restore('SNS', 'publish');
  AWSMock.restore('S3', 'upload');
});


test('should grab mock weather data', async () => {
  const result = await handlers.getWeatherData();

  expect(result).toHaveLength(5);
  expect(result[0]).toBe(50);
  expect(result[1]).toBe('mostly cloudy');
  expect(result[4]).toBe('http://aweatherdomain.com');
});


test('should write data to sns topic', async () => {
  const sns = new AWS.SNS({ region: process.env.PRIMARY_REGION });
  const snsMock = jest.spyOn(sns, 'publish');

  await handlers.sendNotification(
    sns,
    [
      50,
      'mostly cloudy',
      2,
      54,
      'http://aweatherdomain.com',
    ],
  );

  expect(snsMock).toHaveBeenCalledTimes(1);
});


test('should write data to s3', async () => {
  const s3 = new AWS.S3({ region: process.env.PRIMARY_REGION });
  const s3Mock = jest.spyOn(s3, 'upload');

  await handlers.persistToS3(
    s3,
    [
      50,
      'mostly cloudy',
      2,
      54,
      'http://aweatherdomain.com',
    ],
  );

  expect(s3Mock).toHaveBeenCalledTimes(1);
});
