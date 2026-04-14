import sys
sys.path.insert(0, '.')
from app import CLASSIC_DATA, BUILDER_DATA, get_db_lang
import mysql.connector

conn = mysql.connector.connect(user='root', password='1234', host='localhost', database='codedefender')
cur = conn.cursor(dictionary=True)
cur.execute('SELECT language, current_task FROM progress WHERE user_id=33')
progress_rows = cur.fetchall()
cur.execute('SELECT language, score FROM scores WHERE user_id=33')
score_rows = cur.fetchall()
conn.close()

langs = ['python', 'java', 'c']
modes = ['classic', 'builder']
diffs = ['normal', 'pro']
lkm = {'python': 'python', 'java': 'java', 'c': 'c'}
lp = {}

for lg in langs:
    lp[lg] = {}
    for md in modes:
        lp[lg][md] = {}
        ds = BUILDER_DATA if md == 'builder' else CLASSIC_DATA
        ml = len(ds.get(lkm[lg], []))
        for df in diffs:
            db = get_db_lang(lg, md, df)
            lc = 0
            for p in progress_rows:
                if p['language'] == db:
                    lc = min(max(0, p['current_task'] - 1), ml)
            bs = sum(s['score'] for s in score_rows if s['language'] == db or s['language'].startswith(db + '_'))
            lp[lg][md][df] = {'levels': lc, 'score': bs}

print("=== GLOBAL VIEW (Levels + Score per Mode/Diff) ===")
for md in modes:
    for df in diffs:
        tl = sum(lp[lg][md][df]['levels'] for lg in langs)
        ts = sum(lp[lg][md][df]['score'] for lg in langs)
        print(f"  Global {md}/{df}: {tl} levels, score {ts}")

print()
print("=== PER LANGUAGE BREAKDOWN ===")
for lg in langs:
    for md in modes:
        for df in diffs:
            v = lp[lg][md][df]
            if v['levels'] > 0 or v['score'] > 0:
                print(f"  {lg}/{md}/{df}: {v['levels']} levels, score {v['score']}")
