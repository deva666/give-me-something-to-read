import json
import requests
import pygeoip
import os
import re

from random import randint
from datetime import date, timedelta

from django.template import RequestContext
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response, redirect

from constants import *
from django.conf import settings


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def check_blocked_countries(ip):
    path = os.path.join(settings.STATIC_PATH, 'GeoIP.dat')
    gi = pygeoip.GeoIP(path)

    return gi.country_name_by_addr(ip) in BLOCKED_COUNTRIES


def main(request):
    ip = get_client_ip(request)
    if check_blocked_countries(ip):
        return redirect('blocked')
    context = RequestContext(request)
    return render_to_response('main.html', {'title': TITLE}, context)


def blocked(request):
    context = RequestContext(request)
    return render_to_response('blocked.html', {'title': TITLE}, context)


def list_categories(request):
    if request.method == 'GET':
        req = requests.get(BASE_BOOKS_URL + 'names.json?api-key=' + KEY)
        return HttpResponse(req.text, content_type='application/json')
    else:
        raise Http404


def get_books(request):
    if request.method == 'GET':
        category = request.GET['category']
        categories = []
        if category == '':
            categories = get_categories()
            category = get_random_category(categories)['list_name_encoded']

        offset = int(request.GET['offset'])
        publish_date = get_list_publish_date(offset)
        books_request = requests.get(
            BASE_BOOKS_URL + publish_date + category +
            '.json?sort-by=weeks-on-list&sort-order=DESC&api-key=' + KEY)
        books = json.loads(books_request.text)
        books['suggestions'] = SUGGESTIONS
        books['nexts'] = NEXTS
        books['categories'] = categories
        books['selected_category'] = category

        return HttpResponse(json.dumps(books), content_type='application/json')
    else:
        raise Http404


def get_categories():
    categories_request = requests.get(
        BASE_BOOKS_URL + 'names.json?api-key=' + KEY)
    response_json = json.loads(categories_request.text)
    categories = response_json['results']
    return categories


def get_random_category(categories):
    allowed_categories = [c for c in categories
                          if c['list_name'] not in EXCLUDED_CATEGORIES]
    random_num = randint(0, len(allowed_categories) - 1)
    random_category = allowed_categories[random_num]
    return random_category


def get_list_publish_date(offset):
    if offset == 0:
        return ''
    today = date.today()
    offset_days = offset * 90
    today_offset = today - timedelta(days=offset_days)
    return today_offset.isoformat() + '/'
