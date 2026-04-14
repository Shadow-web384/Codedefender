import mysql.connector
import os

db_config = {
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', '1234'),
    'host': os.environ.get('DB_HOST', 'localhost'),
}

try:
    conn = mysql.connector.connect(**db_config)
    print("SUCCESS: Connected to MySQL")
    cursor = conn.cursor()
    cursor.execute("SHOW DATABASES LIKE 'codedefender'")
    db = cursor.fetchone()
    if db:
        print("SUCCESS: Database 'codedefender' exists")
        cursor.execute("USE codedefender")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"Tables: {tables}")
    else:
        print("FAIL: Database 'codedefender' does NOT exist")
    conn.close()
except Exception as e:
    print(f"ERROR: {str(e)}")
