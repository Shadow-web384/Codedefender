import urllib.request, json, time

def test_paiza(code):
    # Paiza.io uses a two-step process: create then get result
    url_create = "https://api.paiza.io/runners/create"
    p_create = {
        "source_code": code,
        "language": "c",
        "api_key": "guest"
    }
    try:
        req = urllib.request.Request(url_create, data=json.dumps(p_create).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            res = json.loads(r.read())
            run_id = res.get('id')
            if not run_id:
                print(f"Paiza -> FAILED TO CREATE: {res}")
                return False
            
            # Poll for result
            for _ in range(5):
                time.sleep(1)
                url_get = f"https://api.paiza.io/runners/get_details?id={run_id}&api_key=guest"
                with urllib.request.urlopen(url_get, timeout=5) as r2:
                    res2 = json.loads(r2.read())
                    if res2.get('status') == 'completed':
                        print(f"Paiza -> SUCCESS")
                        print("Stdout:", res2.get('stdout', ''))
                        print("Stderr:", res2.get('stderr', ''))
                        return True
            print("Paiza -> TIMEOUT")
            return False
    except Exception as e:
        print(f"Paiza -> FAILED: {e}")
        return False

code = '#include <stdio.h>\nint main(){printf("Hello Paiza Developer");return 0;}'
test_paiza(code)
