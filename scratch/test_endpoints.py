import urllib.request, json

def test(url, payload):
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=5) as r:
            res = json.loads(r.read())
            print(f"URL: {url} -> SUCCESS")
            print(res.get('run', {}).get('stdout', ''))
            return True
    except Exception as e:
        print(f"URL: {url} -> FAILED: {e}")
        return False

payload = {'language':'c', 'version':'10.2.0', 'files':[{'content':'#include <stdio.h>\nint main(){printf("Hello CodeDefender");return 0;}'}]}

urls = [
    'https://emkc.org/api/v2/piston/execute',
    'https://piston.rnt.io/api/v2/execute',
    'https://piston.sh/api/v2/execute',
    'https://piston.codebreaker.com/api/v2/execute'
]

for u in urls:
    test(u, payload)
