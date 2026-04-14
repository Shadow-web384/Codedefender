import requests

url = "http://localhost:5000/api/get_task/python?mode=classic&difficulty=normal"
# Need a session with user_id=0
s = requests.Session()
# Login as SystemAdmin
login_url = "http://localhost:5000/api/login"
login_data = {"username": "SystemAdmin", "password": "CyberOps2026!"}
r_login = s.post(login_url, json=login_data)
print("Login status:", r_login.status_code, r_login.json())

# Get task
r_task = s.get(url)
print("Get task status:", r_task.status_code)
if r_task.status_code != 200:
    print("Error:", r_task.text)
else:
    print("Task data:", r_task.json())
