import urllib.request as r, json

urls = [
    'https://emkc.org/api/v2/piston/execute',
    'https://godoodle.net/api/v2/execute',
    'https://piston.pterodactyl.io/api/v2/execute',
    'https://piston.codebreaker.com/api/v2/execute'
]
for u in urls:
    try:
        req = r.Request(u, data=json.dumps({'language':'python','version':'3.10.0','files':[{'content':'print(1)'}]}).encode(), headers={'Content-Type': 'application/json'})
        print(u, r.urlopen(req, timeout=3).read()[:100])
    except Exception as e:
        print(u, e)
