import urllib.request, json, time

def test_paiza(lang, code):
    url_create = "https://api.paiza.io/runners/create"
    p_create = {
        "source_code": code,
        "language": lang,
        "api_key": "guest"
    }
    try:
        req = urllib.request.Request(url_create, data=json.dumps(p_create).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            run_id = json.loads(r.read()).get('id')
            if not run_id: return f"{lang} FAILED"
            
            for _ in range(5):
                time.sleep(1)
                url_get = f"https://api.paiza.io/runners/get_details?id={run_id}&api_key=guest"
                with urllib.request.urlopen(url_get, timeout=5) as r2:
                    res2 = json.loads(r2.read())
                    if res2.get('status') == 'completed':
                        return f"{lang} SUCCESS: {res2.get('stdout', '').strip()}"
            return f"{lang} TIMEOUT"
    except Exception as e:
        return f"{lang} ERROR: {e}"

print(test_paiza("python3", "print('Python Ready')"))
print(test_paiza("java", "public class Main { public static void main(String[] args) { System.out.println(\"Java Ready\"); } }"))
