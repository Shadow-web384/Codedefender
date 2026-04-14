import urllib.request, json, time

def test_paiza_java(code):
    url_create = "https://api.paiza.io/runners/create"
    p_create = {
        "source_code": code,
        "language": "java",
        "api_key": "guest"
    }
    try:
        req = urllib.request.Request(url_create, data=json.dumps(p_create).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            run_id = json.loads(r.read()).get('id')
            if not run_id: return "FAILED TO CREATE"
            
            for _ in range(5):
                time.sleep(1)
                url_get = f"https://api.paiza.io/runners/get_details?id={run_id}&api_key=guest"
                with urllib.request.urlopen(url_get, timeout=5) as r2:
                    res2 = json.loads(r2.read())
                    if res2.get('status') == 'completed':
                        return f"SUCCESS: {res2.get('stdout', '').strip()} | ERR: {res2.get('build_stderr', '').strip()}"
            return "TIMEOUT"
    except Exception as e:
        return f"ERROR: {e}"

# Test with a non-Main class
code = "public class Hello { public static void main(String[] args) { System.out.println(\"Hello World\"); } }"
print(test_paiza_java(code))
