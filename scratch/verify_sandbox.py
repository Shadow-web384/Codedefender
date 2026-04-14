import requests
import time

def test_sandbox(lang, code):
    url = "http://127.0.0.1:5000/api/sandbox"
    payload = {
        "language": lang,
        "code": code
    }
    try:
        response = requests.post(url, json=payload, timeout=20)
        return response.json()
    except Exception as e:
        return str(e)

# Start flask if it's not running? 
# The user's metadata says it's running (python app.py).
# Assuming it's on localhost:5000.

langs = {
    "python": "print('Python Cloud OK')",
    "java": "public class Main { public static void main(String[] args) { System.out.println(\"Java Cloud OK\"); } }",
    "c": "#include <stdio.h>\nint main(){printf(\"C Cloud OK\"); return 0;}"
}

for lang, code in langs.items():
    print(f"Testing {lang}...")
    result = test_sandbox(lang, code)
    print(result)
