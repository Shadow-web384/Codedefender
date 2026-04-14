import urllib.request, json

def test_godbolt(code):
    url = "https://godbolt.org/api/compiler/g102/compile"
    p = {
        "source": code,
        "options": {
            "userArgs": "",
            "compilerOptions": {"skipAsm": True},
            "filters": {"execute": True}
        }
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(p).encode(), headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            res = json.loads(r.read())
            # Godbolt exec results are in 'execResult'
            if 'execResult' in res:
                print(f"Godbolt -> SUCCESS")
                print(res['execResult'].get('stdout', ''))
                return True
            else:
                print(f"Godbolt -> NO EXEC RESULT: {res.keys()}")
                return False
    except Exception as e:
        print(f"Godbolt -> FAILED: {e}")
        return False

code = '#include <stdio.h>\nint main(){printf("Hello Godbolt Developer");return 0;}'
test_godbolt(code)
