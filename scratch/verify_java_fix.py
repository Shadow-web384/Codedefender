import urllib.request, json, time

def test_sandbox_java_fix(code):
    url = "http://127.0.0.1:5000/api/sandbox"
    p = {"language": "java", "code": code}
    try:
        req = urllib.request.Request(url, data=json.dumps(p).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as r:
            return json.loads(r.read())
    except Exception as e:
        return str(e)

# Test with a non-Main class name
code = "public class MyCloudClass { public static void main(String[] args) { System.out.println(\"Renaming Success!\"); } }"
print("Testing Java Class Renaming...")
print(test_sandbox_java_fix(code))
