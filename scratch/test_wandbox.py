import urllib.request, json

def test_wandbox(code):
    url = "https://wandbox.org/api/compile.json"
    p = {
        "compiler": "gcc-head",
        "code": code,
        "options": "warning"
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(p).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            res = json.loads(r.read())
            print(f"Wandbox -> SUCCESS")
            print("Status:", res.get('status', ''))
            print("Stdout:", res.get('program_output', ''))
            print("Stderr:", res.get('program_error', ''))
            return True
    except Exception as e:
        print(f"Wandbox -> FAILED: {e}")
        return False

code = '#include <stdio.h>\nint main(){printf("Hello Wandbox Developer");return 0;}'
test_wandbox(code)
