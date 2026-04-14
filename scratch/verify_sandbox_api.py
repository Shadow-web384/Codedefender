import urllib.request, json, time

def test_api(lang, code):
    url = "http://127.0.0.1:5000/api/sandbox"
    p = {"language": lang, "code": code}
    try:
        req = urllib.request.Request(url, data=json.dumps(p).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as r:
            return json.loads(r.read())
    except Exception as e:
        return str(e)

langs = {
    "python": "print('Python Cloud OK')",
    "java": "public class Main { public static void main(String[] args) { System.out.println(\"Java Cloud OK\"); } }",
    "c": "#include <stdio.h>\\nint main(){printf(\"C Cloud OK\"); return 0;}"
}

for lang, code in langs.items():
    print(f"Testing {lang}...")
    print(test_api(lang, code))
