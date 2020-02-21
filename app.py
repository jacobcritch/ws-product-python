# -*- coding: utf-8 -*-

import os
from flask import Flask, jsonify, request, render_template
import sqlalchemy
import redis
import time
import sys

# web app
app = Flask(__name__)

# database engine
engine = sqlalchemy.create_engine(os.getenv('SQL_URI'))
r = redis.StrictRedis(decode_responses=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/events/hourly', methods=['GET', 'POST'])
def events_hourly():
    if rateChecker(request) == "False": return "Rate exceeded, try again later"
    return queryHelper('''
        SELECT date, hour, events
        FROM public.hourly_events
        ORDER BY date, hour
        LIMIT 168;
    ''')

@app.route('/events/daily')
def events_daily():
    if rateChecker(request) == "False": return "Rate exceeded, try again later"
    return queryHelper('''
        SELECT date, SUM(events) AS events
        FROM public.hourly_events
        GROUP BY date
        ORDER BY date
        LIMIT 7;
    ''')

@app.route('/stats/hourly')
def stats_hourly():
    if rateChecker(request) == "False": return "Rate exceeded, try again later"
    return queryHelper('''
        SELECT date, hour, impressions, clicks, revenue
        FROM public.hourly_stats
        ORDER BY date, hour
        LIMIT 168;
    ''')

@app.route('/stats/daily')
def stats_daily():
    if rateChecker(request) == "False": return "Rate exceeded, try again later"
    return queryHelper('''
        SELECT date,
            SUM(impressions) AS impressions,
            SUM(clicks) AS clicks,
            SUM(revenue) AS revenue
        FROM public.hourly_stats
        GROUP BY date
        ORDER BY date
        LIMIT 7;
    ''')

@app.route('/poi')
def poi():
    if rateChecker(request) == "False": return "Rate exceeded, try again later"
    return queryHelper('''
        SELECT *
        FROM public.poi;
    ''')

def queryHelper(query):
    with engine.connect() as conn:
        result = conn.execute(query).fetchall()
        return jsonify([dict(row.items()) for row in result])
        
def rateChecker(req):
    limit = 20 # Limit of requests per minute
    ip = req.environ['REMOTE_ADDR']
    
    if r.exists(ip):
        ipDict = r.hgetall(ip) # Get dictionary of attributes from client's IP
        numReqs = int(ipDict["numReqs"]) 

        if time.time() > float(ipDict["expiry"]): # If expiry time limit has passed set new expiry time
            r.hmset(ip, { "numReqs": 1, "expiry": str(time.time()+60) })
            return "True"
        elif time.time() < float(ipDict["expiry"]): # Else if expiry time not passed yet
            if numReqs >= limit:
                return "False"
            if numReqs <= limit:
                r.hmset(ip, { "numReqs": int(numReqs+1) })
                return "True"
    else:
        r.hmset(ip, { "numReqs": 1, "expiry": str(time.time() + 60) })
        return "True"