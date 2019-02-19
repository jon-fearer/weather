import os
from base64 import b64decode

import boto3
import pymysql
import requests

rds_host = boto3.client('kms').decrypt(
                 CiphertextBlob=b64decode(
                     os.environ['rds_host']))['Plaintext'].decode()
name = boto3.client('kms').decrypt(
             CiphertextBlob=b64decode(
                 os.environ['name']))['Plaintext'].decode()
password = boto3.client('kms').decrypt(
                 CiphertextBlob=b64decode(
                     os.environ['password']))['Plaintext'].decode()
db_name = boto3.client('kms').decrypt(
                CiphertextBlob=b64decode(
                    os.environ['db_name']))['Plaintext'].decode()

conn = pymysql.connect(rds_host,
                       user=name,
                       passwd=password,
                       db=db_name,
                       connect_timeout=5)


def handler(event, context):
    print('Begin function...')
    apikey = boto3.client('kms').decrypt(
                   CiphertextBlob=b64decode(
                       os.environ['apikey']))['Plaintext'].decode()
    url = 'http://dataservice.accuweather.com/currentconditions/v1/347810'
    payload = {'apikey': apikey, 'details': 'true'}
    print('Ready to send request to {}'.format(url))
    r = requests.get(url, params=payload)
    # Temperature, Description, Wind, RealFeel, Link
    data = [int(r.json()[0]['Temperature']['Imperial']['Value']),
            r.json()[0]['WeatherText'].lower(),
            int(r.json()[0]['Wind']['Speed']['Imperial']['Value']),
            int(r.json()[0]['RealFeelTemperature']['Imperial']['Value']),
            r.json()[0]['MobileLink']]
    print('Data received:')
    print(data)
    client = boto3.client('sns')
    TopicArn = 'arn:aws:sns:us-east-1:528165410097:Weather'
    msg = 'Right now in Denver it\'s {}°F and {}, with winds ' + \
          'of {} miles per hour. The RealFeel temperature is {}°F.'
    Message = msg.format(data[0], data[1], data[2], data[3])
    client.publish(TopicArn=TopicArn, Message=Message)
    print('Message sent')
    sql = '''INSERT INTO DailyWeather (Rundate,City,Temperature,
                                       Description,WindSpeed)
             VALUES (UTC_TIMESTAMP(),'Denver',%s,%s,%s)'''
    crsr = conn.cursor()
    crsr.execute(sql, data[:3])
    print('Insert complete')
    conn.commit()


if __name__ == '__main__':
    handler(None, None)
