import urllib.request, json

def test_judge0(code):
    url = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true"
    p = {
        "source_code": code,
        "language_id": 50 # C (GCC 9.2.0)
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(p).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            res = json.loads(r.read())
            print(f"Judge0 -> SUCCESS")
            print("Stdout:", res.get('stdout', ''))
            print("Stderr:", res.get('stderr', ''))
            print("Compile Out:", res.get('compile_output', ''))
            return True
    except Exception as e:
        print(f"Judge0 -> FAILED: {e}")
        return False

code = '#include <stdio.h>\nint main(){printf("Hello Judge0 Developer");return 0;}'
test_judge0(code)
