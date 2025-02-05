from haralyzer import HarParser, HarPage
from urllib.parse import urlencode
import logging
logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)
from llm_helpers import make_query
import json

# pulled from https://github.com/snoe/harToCurl/blob/master/harToCurl and repurposed for use with python3
def create_curl1(data):
    excluded_headers = {
        'content-length', 
        'connection',
        ':authority',
        ':method',
        ':path',
        ':scheme'
    }

    opts = {}
    opts['url'] = data['request']['url']
    opts['cookies'] = urlencode([(cookie['name'], cookie['value']) for cookie in data['request']['cookies']])
    opts['http0'] = '-0' if data['request']['httpVersion'] == 'HTTP/1.0' else ''
    opts['method'] = data['request']['method']
    headers = []
    for header in data['request']['headers']:
        if header['name'] not in excluded_headers:
            name = header['name'].replace('"', '\\"')
            value = header['value'].replace('"', '\\"')
            headers.append(f'-H "{name}: {value}"')
    opts['headers'] = ' '.join(headers)

    if 'postData' in data['request'] and data['request']['postData'].get('text'):
        opts['data_arg'] = '--data-raw'
        opts['postData'] = data['request']['postData']['text'].replace('"', '\\"')
    else:
        opts['data_arg'] = ''
        opts['postData'] = ''

    parts = [
        'curl',
        '-X {method}',
        '{http0}',
        '-b "{cookies}"' if opts['cookies'] else '',
        '{headers}',
        '{data_arg} "{postData}"' if opts['postData'] else '',
        '"{url}"'
    ]

    return ' '.join(filter(None, parts)).format(**opts)


def get_content_type(response):
    headers = response.get("headers", [])
    for header in headers:
        if header.get("name", "").lower() == "content-type":
            return header.get("value", "")
    return ""


def parse_har(har_fp):
    asset_extensions = (".png", ".jpg", ".jpeg", ".svg", ".ico", ".css", ".js", ".woff2", ".webp")
    html_content_types = ("text/html", "text/css")

    with open(har_fp, 'r', encoding='utf-8') as f:
        har_data = json.load(f)

    log = har_data.get("log", {})
    entries = log.get("entries", [])
    parsed_entries = {}
    raw_entries = {}

    for entry in entries:
        request = entry.get("request", {})
        response = entry.get("response", {})
        url = request.get("url", "")
        method = request.get("method", "")
        
        if url.lower().endswith(asset_extensions):
            continue

        content_type = get_content_type(response)
        if any(ct in content_type for ct in html_content_types):
            continue

        query_string = request.get("queryString", [])
        query_params = {qp["name"]: qp["value"] for qp in query_string}

        headers = request.get("headers", [])
        relevant_req_headers = {}
        for h in headers:
            h_name = h.get("name", "").lower()
            if h_name in ["content-type", "authorization", "x-api-key"]:
                relevant_req_headers[h["name"]] = h.get("value", "")

        parsed_entry = {
            "method": method,
            "url": url,
            "query parameters": query_params,
        }
        
        parsed_entries[url] = parsed_entry
        raw_entries[url] = entry
    return parsed_entries, raw_entries


def retrieve_best_curl(query, fp):
    parsed_entries, raw_entries = parse_har(fp)
    success, message = make_query(query, parsed_entries)
    if success:
        return success, create_curl1(raw_entries.get(message))
    else:
        return success, message