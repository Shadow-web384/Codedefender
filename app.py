import os
import random
import warnings
from flask import Flask, jsonify, request, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "galaxy_defender_key")

# ── Security check: warn if running with insecure defaults ────────────────────
if os.environ.get("FLASK_SECRET_KEY") is None:
    warnings.warn(
        "FLASK_SECRET_KEY is not set. Using insecure default. "
        "Set this environment variable before deploying.",
        stacklevel=1
    )
if os.environ.get("ADMIN_PASSWORD") is None:
    warnings.warn(
        "ADMIN_PASSWORD is not set. Using insecure hardcoded default. "
        "Set this environment variable before deploying.",
        stacklevel=1
    )

# Allow requests from the same origin + file:// for local testing
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin', '')
    if origin in ('http://localhost:5000', 'http://127.0.0.1:5000', ''):
        response.headers['Access-Control-Allow-Origin'] = origin or '*'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

@app.route('/api/options', methods=['OPTIONS'])
def options():
    return '', 204

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "SystemAdmin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "CyberOps2026!")

db_config = {
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', '1234'),
    'host': os.environ.get('DB_HOST', 'localhost'),
    'database': os.environ.get('DB_NAME', 'codedefender')
}


def get_db():
    return mysql.connector.connect(**db_config)

def get_db_lang(lang, mode, difficulty):
    # Compresses strings into 6 characters to stay within safety limits
    l_prefix = lang[:2].lower()
    m_prefix = mode[:1].lower()
    d_prefix = difficulty[:1].lower()
    return f"{l_prefix}_{m_prefix}_{d_prefix}"

def ensure_stat_columns():
    """Ensure persistence columns exist in users table."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cols = [
            ("total_words_typed", "INT DEFAULT 0"),
            ("total_keys_total", "INT DEFAULT 0"),
            ("total_keys_hit", "INT DEFAULT 0"),
            ("total_play_time_ms", "BIGINT DEFAULT 0")
        ]
        for col_name, col_def in cols:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                conn.commit()
            except:
                pass # Already exists
        conn.close()
    except:
        pass

# Run migration on start
ensure_stat_columns()

# --- CLASSIC MODE (Keywords) ---
CLASSIC_DATA = {   'c': [   {   'id': 1,
                 'tip': 'SEC 1: TYPES',
                 'words': [   {   'display': 'int',
                                  'target': 'int',
                                  'type': 'standard'},
                              {   'display': 'char',
                                  'target': 'char',
                                  'type': 'standard'},
                              {   'display': 'float',
                                  'target': 'float',
                                  'type': 'standard'},
                              {   'display': 'double',
                                  'target': 'double',
                                  'type': 'standard'},
                              {   'display': 'void',
                                  'target': 'void',
                                  'type': 'standard'},
                              {   'display': 'long',
                                  'target': 'long',
                                  'type': 'standard'},
                              {   'display': 'short',
                                  'target': 'short',
                                  'type': 'standard'}]},
             {   'id': 2,
                 'tip': 'SEC 2: PREPROCESSOR',
                 'words': [   {   'display': '#include',
                                  'target': '#include',
                                  'type': 'standard'},
                              {   'display': '#define',
                                  'target': '#define',
                                  'type': 'standard'},
                              {   'display': '#ifdef',
                                  'target': '#ifdef',
                                  'type': 'standard'},
                              {   'display': '#endif',
                                  'target': '#endif',
                                  'type': 'standard'},
                              {   'display': 'main',
                                  'target': 'main',
                                  'type': 'standard'},
                              {   'display': 'return',
                                  'target': 'return',
                                  'type': 'standard'}]},
             {   'id': 3,
                 'tip': 'SEC 3: POINTERS',
                 'words': [   {   'display': 'struct',
                                  'target': 'struct',
                                  'type': 'standard'},
                              {   'display': 'union',
                                  'target': 'union',
                                  'type': 'standard'},
                              {   'display': 'enum',
                                  'target': 'enum',
                                  'type': 'standard'},
                              {   'display': 'sizeof',
                                  'target': 'sizeof',
                                  'type': 'standard'},
                              {   'display': 'malloc',
                                  'target': 'malloc',
                                  'type': 'standard'},
                              {   'display': 'free',
                                  'target': 'free',
                                  'type': 'standard'},
                              {   'display': 'null',
                                  'target': 'null',
                                  'type': 'standard'}]},
             {   'id': 4,
                 'tip': 'SEC 4: I/O STREAM',
                 'words': [   {   'display': 'printf',
                                  'target': 'printf',
                                  'type': 'standard'},
                              {   'display': 'scanf',
                                  'target': 'scanf',
                                  'type': 'standard'},
                              {   'display': 'fgets',
                                  'target': 'fgets',
                                  'type': 'standard'},
                              {   'display': 'puts',
                                  'target': 'puts',
                                  'type': 'standard'},
                              {   'display': 'fopen',
                                  'target': 'fopen',
                                  'type': 'standard'},
                              {   'display': 'fclose',
                                  'target': 'fclose',
                                  'type': 'standard'}]},
             {   'id': 5,
                 'tip': 'SEC 5: MEMORY',
                 'words': [   {   'display': 'alloc',
                                  'target': 'alloc',
                                  'type': 'standard'},
                              {   'display': 'calloc',
                                  'target': 'calloc',
                                  'type': 'standard'},
                              {   'display': 'realloc',
                                  'target': 'realloc',
                                  'type': 'standard'},
                              {   'display': 'pointer',
                                  'target': 'pointer',
                                  'type': 'standard'},
                              {   'display': 'address',
                                  'target': 'address',
                                  'type': 'standard'},
                              {   'display': 'ref',
                                  'target': 'ref',
                                  'type': 'standard'}]}],
    'java': [   {   'id': 1,
                    'tip': 'SEC 1: PRIMITIVES',
                    'words': [   {   'display': 'int',
                                     'target': 'int',
                                     'type': 'standard'},
                                 {   'display': 'char',
                                     'target': 'char',
                                     'type': 'standard'},
                                 {   'display': 'void',
                                     'target': 'void',
                                     'type': 'standard'},
                                 {   'display': 'byte',
                                     'target': 'byte',
                                     'type': 'standard'},
                                 {   'display': 'long',
                                     'target': 'long',
                                     'type': 'standard'},
                                 {   'display': 'double',
                                     'target': 'double',
                                     'type': 'standard'},
                                 {   'display': 'float',
                                     'target': 'float',
                                     'type': 'standard'}]},
                {   'id': 2,
                    'tip': 'SEC 2: ACCESS CTRL',
                    'words': [   {   'display': 'public',
                                     'target': 'public',
                                     'type': 'standard'},
                                 {   'display': 'private',
                                     'target': 'private',
                                     'type': 'standard'},
                                 {   'display': 'protected',
                                     'target': 'protected',
                                     'type': 'standard'},
                                 {   'display': 'static',
                                     'target': 'static',
                                     'type': 'standard'},
                                 {   'display': 'final',
                                     'target': 'final',
                                     'type': 'standard'}]},
                {   'id': 3,
                    'tip': 'SEC 3: FLOW CTRL',
                    'words': [   {   'display': 'if',
                                     'target': 'if',
                                     'type': 'standard'},
                                 {   'display': 'else',
                                     'target': 'else',
                                     'type': 'standard'},
                                 {   'display': 'switch',
                                     'target': 'switch',
                                     'type': 'standard'},
                                 {   'display': 'case',
                                     'target': 'case',
                                     'type': 'standard'},
                                 {   'display': 'default',
                                     'target': 'default',
                                     'type': 'standard'},
                                 {   'display': 'do',
                                     'target': 'do',
                                     'type': 'standard'},
                                 {   'display': 'while',
                                     'target': 'while',
                                     'type': 'standard'}]},
                {   'id': 4,
                    'tip': 'SEC 4: OBJECTS',
                    'words': [   {   'display': 'new',
                                     'target': 'new',
                                     'type': 'standard'},
                                 {   'display': 'this',
                                     'target': 'this',
                                     'type': 'standard'},
                                 {   'display': 'super',
                                     'target': 'super',
                                     'type': 'standard'},
                                 {   'display': 'class',
                                     'target': 'class',
                                     'type': 'standard'},
                                 {   'display': 'interface',
                                     'target': 'interface',
                                     'type': 'standard'},
                                 {   'display': 'extends',
                                     'target': 'extends',
                                     'type': 'standard'}]},
                {   'id': 5,
                    'tip': 'SEC 5: EXCEPTIONS',
                    'words': [   {   'display': 'try',
                                     'target': 'try',
                                     'type': 'standard'},
                                 {   'display': 'catch',
                                     'target': 'catch',
                                     'type': 'standard'},
                                 {   'display': 'throw',
                                     'target': 'throw',
                                     'type': 'standard'},
                                 {   'display': 'throws',
                                     'target': 'throws',
                                     'type': 'standard'},
                                 {   'display': 'finally',
                                     'target': 'finally',
                                     'type': 'standard'},
                                 {   'display': 'null',
                                     'target': 'null',
                                     'type': 'standard'}]}],
    'python': [   {   'id': 1,
                      'tip': 'SEC 1: DATA STREAMS',
                      'words': [   {   'display': 'print',
                                       'target': 'print',
                                       'type': 'standard'},
                                   {   'display': 'str',
                                       'target': 'str',
                                       'type': 'standard'},
                                   {   'display': 'float',
                                       'target': 'float',
                                       'type': 'standard'},
                                   {   'display': 'list',
                                       'target': 'list',
                                       'type': 'standard'},
                                   {   'display': 'dict',
                                       'target': 'dict',
                                       'type': 'standard'},
                                   {   'display': 'int',
                                       'target': 'int',
                                       'type': 'standard'},
                                   {   'display': 'bool',
                                       'target': 'bool',
                                       'type': 'standard'},
                                   {   'display': 'char',
                                       'target': 'char',
                                       'type': 'standard'}]},
                  {   'id': 2,
                      'tip': 'SEC 2: LOGIC GATES',
                      'words': [   {   'display': 'if',
                                       'target': 'if',
                                       'type': 'standard'},
                                   {   'display': 'elif',
                                       'target': 'elif',
                                       'type': 'standard'},
                                   {   'display': 'else',
                                       'target': 'else',
                                       'type': 'standard'},
                                   {   'display': 'for',
                                       'target': 'for',
                                       'type': 'standard'},
                                   {   'display': 'while',
                                       'target': 'while',
                                       'type': 'standard'},
                                   {   'display': 'breach',
                                       'hint': "[ Typo: 'breach' -> 'br__k' ]",
                                       'isCorrupt': True,
                                       'target': 'break',
                                       'type': 'debug'},
                                   {   'display': 'continue',
                                       'target': 'continue',
                                       'type': 'standard'},
                                   {   'display': 'input',
                                       'target': 'input',
                                       'type': 'standard'}]},
                  {   'id': 3,
                      'tip': 'SEC 3: MEMORY BANKS',
                      'words': [   {   'display': 'append',
                                       'target': 'append',
                                       'type': 'standard'},
                                   {   'display': 'extend',
                                       'target': 'extend',
                                       'type': 'standard'},
                                   {   'display': 'pop',
                                       'target': 'pop',
                                       'type': 'standard'},
                                   {   'display': 'remove',
                                       'target': 'remove',
                                       'type': 'standard'},
                                   {   'display': 'sort',
                                       'target': 'sort',
                                       'type': 'standard'},
                                   {   'display': 'reverse',
                                       'target': 'reverse',
                                       'type': 'standard'},
                                   {   'display': 'print(Hello)',
                                       'hint': '[ Strings need "quotes" around '
                                               'them ]',
                                       'isCorrupt': True,
                                       'target': 'print("Hello")',
                                       'type': 'debug'}]},
                  {   'id': 4,
                      'tip': 'SEC 4: SUB-ROUTINES',
                      'words': [   {   'display': 'def',
                                       'target': 'def',
                                       'type': 'standard'},
                                   {   'display': 'return',
                                       'target': 'return',
                                       'type': 'standard'},
                                   {   'display': 'lambda',
                                       'target': 'lambda',
                                       'type': 'standard'},
                                   {   'display': 'yield',
                                       'target': 'yield',
                                       'type': 'standard'},
                                   {   'display': 'global',
                                       'target': 'global',
                                       'type': 'standard'},
                                   {   'display': 'class',
                                       'target': 'class',
                                       'type': 'standard'}]},
                  {   'id': 5,
                      'tip': 'SEC 5: SYSTEM CORE',
                      'words': [   {   'display': 'import',
                                       'target': 'import',
                                       'type': 'standard'},
                                   {   'display': 'from',
                                       'target': 'from',
                                       'type': 'standard'},
                                   {   'display': 'try',
                                       'target': 'try',
                                       'type': 'standard'},
                                   {   'display': 'except',
                                       'target': 'except',
                                       'type': 'standard'},
                                   {   'display': 'finally',
                                       'target': 'finally',
                                       'type': 'standard'},
                                   {   'display': 'raise',
                                       'target': 'raise',
                                       'type': 'standard'},
                                   {   'display': 'with',
                                     'target': 'with',
                                     'type': 'standard'}]}]}

# --- BUILDER MODE (Story Missions + Boss + Syntax Repair) ---
BUILDER_DATA = {
    'c': [
        {
            'expected_output': '> Student\nHello, Student!',
            'id': 1,
            'lines': [
                {'display': '#include <stdio.h>', 'target': '#include <stdio.h>', 'type': 'standard'},
                {'display': 'int main ( ) {', 'target': 'int main ( ) {', 'type': 'standard'},
                {'display': '  char name [ 40 ] ;', 'target': '  char name [ 40 ] ;', 'type': 'standard'},
                {'display': '  printf ( "Name? " ) ;', 'target': '  printf ( "Name? " ) ;', 'type': 'standard'},
                {'display': '  _____ ( "%s" , name ) ;', 'hint': '[ Read user input ]', 'target': 'scanf', 'type': 'sniper'},
                {'display': '  ______ ( "Hello, %s!" , name ) ;', 'hint': '[ Print greeting ]', 'target': 'printf', 'type': 'sniper'},
                {'display': '  return 0 ;', 'target': '  return 0 ;', 'type': 'standard'},
                {'display': '}', 'target': '}', 'type': 'standard'}
            ],
            'tip': 'HELLO WORLD',
            'concepts': [{'type': 'Output', 'code': 'printf("Hello!");'}, {'type': 'Input', 'code': 'scanf("%s", name);'}]
        },
        {
            'expected_output': '> 5.0 10.0\nSum: 15.00',
            'id': 2,
            'lines': [
                {'display': '#include <stdio.h>', 'target': '#include <stdio.h>', 'type': 'standard'},
                {'display': 'int main ( ) {', 'target': 'int main ( ) {', 'type': 'standard'},
                {'display': '  double a , b ;', 'target': '  double a , b ;', 'type': 'standard'},
                {'display': '_____ ( "%lf %lf" , & a , & b ) ;', 'hint': '[ Formatted scan ]', 'target': 'scanf', 'type': 'sniper'},
                {'display': '______ ( "Sum: %.2f\\n" , a + b ) ;', 'hint': '[ Formatted print ]', 'target': 'printf', 'type': 'sniper'},
                {'display': '}', 'target': '}', 'type': 'standard'}
            ],
            'tip': 'SIMPLE CALCULATOR',
            'concepts': [{'type': 'Variables', 'code': 'double a, b;'}, {'type': 'Format Specifiers', 'code': 'printf("%.2f", sum);'}]
        },
        {
            'expected_output': '> 7\nYes',
            'id': 3,
            'lines': [
                {'display': '#include <stdio.h>', 'target': '#include <stdio.h>', 'type': 'standard'},
                {'display': '#include <stdlib.h>', 'target': '#include <stdlib.h>', 'type': 'standard'},
                {'display': 'int main ( ) {', 'target': 'int main ( ) {', 'type': 'standard'},
                {'display': '___ secret = 7 , g ;', 'hint': '[ Integer type ]', 'target': 'int', 'type': 'sniper'},
                {'display': '_____ ( "%d" , & g ) ;', 'hint': '[ Formatted scan ]', 'target': 'scanf', 'type': 'sniper'},
                {'display': '______ ( "%s\\n" , g == secret ? "Yes" : "No" ) ;', 'hint': '[ Formatted print ]', 'target': 'printf', 'type': 'sniper'},
                {'display': '}', 'target': '}', 'type': 'standard'}
            ],
            'tip': 'GUESS THE NUMBER',
            'concepts': [{'type': 'Conditionals', 'code': 'g == secret ? "Yes" : "No"'}],
        },
        {
            'expected_output': 'Values: 10 20',
            'id': 4,
            'lines': [
                {'display': 'struct Point { int x , y ; } ;', 'target': 'struct Point { int x , y ; } ;', 'type': 'standard'},
                {'display': 'struct Point p = { ______ , 20 } ;', 'hint': '[ Assign 10 ]', 'target': '10', 'type': 'sniper'},
                {'display': 'printf ( "Values: %d %d" , p . x , p . ______ ) ;', 'hint': '[ Access y ]', 'target': 'y', 'type': 'sniper'}
            ],
            'tip': 'DATA STRUCTURES',
            'concepts': [{'type': 'Structs', 'code': 'struct Point p;'}]
        },
        {
            'expected_output': 'Value: 42',
            'id': 5,
            'lines': [
                {'display': 'int val = 42 ;', 'target': 'int val = 42 ;', 'type': 'standard'},
                {'display': 'int * ptr = ______ ;', 'hint': '[ Address of val ]', 'target': '& val', 'type': 'sniper'},
                {'display': 'printf ( "Value: %d" , ______ ptr ) ;', 'hint': '[ De-reference pointer ]', 'target': '*', 'type': 'sniper'}
            ],
            'tip': 'MEMORY ADDRESSING',
            'concepts': [{'type': 'Pointers', 'code': 'int *p = &x;'}]
        }
    ],
    'java': [
        {
            'expected_output': '> Name: Alex\nHi, Alex!',
            'id': 1,
            'lines': [
                {'display': 'import java . util . _______ ;', 'hint': '[ Import scanner utility ]', 'target': 'Scanner', 'type': 'sniper'},
                {'display': 'public class HelloWorld {', 'target': 'public class HelloWorld {', 'type': 'standard'},
                {'display': '  public static void main ( String [ ] args ) {', 'target': '  public static void main ( String [ ] args ) {', 'type': 'standard'},
                {'display': '    Scanner sc = new _______ ( System . in ) ;', 'hint': '[ Initialize scanner ]', 'target': 'Scanner', 'type': 'sniper'},
                {'display': '    String name = sc . _______ ( ) ;', 'hint': '[ Read next line ]', 'target': 'nextLine', 'type': 'sniper'},
                {'display': '    System . out . _______ ( "Hi, " + name + "!" ) ;', 'hint': '[ Print to console ]', 'target': 'println', 'type': 'sniper'},
                {'display': '  }', 'target': '  }', 'type': 'standard'},
                {'display': '}', 'target': '}', 'type': 'standard'}
            ],
            'tip': 'HELLO WORLD',
            'concepts': [{'type': 'Scanner', 'code': 'Scanner sc = new Scanner(System.in);'}]
        },
        {
            'expected_output': '> 5.0 10.0\nSum: 15.0',
            'id': 2,
            'lines': [
                {'display': '_______ ;', 'hint': '[ Input scanner ]', 'target': 'Scanner', 'type': 'sniper'},
                {'display': 'public class Calc {', 'target': 'public class Calc {', 'type': 'standard'},
                {'display': '______ static void main ( String [ ] args ) {', 'hint': '[ Access modifier ]', 'target': 'public', 'type': 'sniper'},
                {'display': '    Scanner sc = new Scanner ( ______ . in ) ;', 'hint': '[ System class ]', 'target': 'System', 'type': 'sniper'},
                {'display': '______ a = sc . nextDouble ( ) , b = sc . nextDouble ( ) ;', 'hint': '[ Complete ]', 'target': 'double', 'type': 'sniper'},
                {'display': '______ . out . println ( "Sum: " + ( a + b ) ) ;', 'hint': '[ System class ]', 'target': 'System', 'type': 'sniper'},
                {'display': '  }', 'target': '  }', 'type': 'standard'},
                {'display': '}', 'target': '}', 'type': 'standard'}
            ],
            'tip': 'SIMPLE CALCULATOR',
            'concepts': [{'type': 'Data Types', 'code': 'double a = sc.nextDouble();'}]
        },
        {
            'expected_output': '> 7\nYes!',
            'id': 3,
            'lines': [
                {'display': '_______ ;', 'hint': '[ Input scanner ]', 'target': 'Scanner', 'type': 'sniper'},
                {'display': 'public class Guess {', 'target': 'public class Guess {', 'type': 'standard'},
                {'display': '______ static void main ( String [ ] args ) {', 'hint': '[ Access modifier ]', 'target': 'public', 'type': 'sniper'},
                {'display': '    int secret = ( int ) ( Math . ______ ( ) * 10 ) + 1 ;', 'hint': '[ Random library ]', 'target': 'random', 'type': 'sniper'},
                {'display': '    int g = new Scanner ( ______ . in ) . nextInt ( ) ;', 'hint': '[ System class ]', 'target': 'System', 'type': 'sniper'},
                {'display': '______ . out . println ( g == secret ? "Yes!" : "No, it was " + secret ) ;', 'hint': '[ System class ]', 'target': 'System', 'type': 'sniper'},
                {'display': '  }', 'target': '  }', 'type': 'standard'},
                {'display': '}', 'target': '}', 'type': 'standard'}
            ],
            'tip': 'GUESS THE NUMBER',
            'concepts': [{'type': 'Math', 'code': 'Math.random() * 10'}, {'type': 'Ternary', 'code': 'g == secret ? "Yes" : "No"'}]
        }
    ],
    'python': [
        {
            'expected_output': '> What is your name? Alex\nHello, Alex!',
            'id': 1,
            'lines': [
                {'display': 'name = _____ ( "What is your name? " )', 'hint': '[ Input function ]', 'target': 'input', 'type': 'sniper'},
                {'display': 'print ( "Hello, " + nme + "!" )', 'hint': '[ Variable typo: nme -> name ]', 'isCorrupt': True, 'target': 'print ( "Hello, " + name + "!" )', 'type': 'debug'}
            ],
            'tip': 'HELLO WORLD',
            'concepts': [{'type': 'Input/Output', 'code': 'name = input("Name?")<br>print(name)'}]
        },
        {
            'expected_output': '> Enter first: 5\n> Enter second: 10\nSum: 15.0',
            'id': 2,
            'lines': [
                {'display': '_____ ( input ( "Enter first number: " ) )', 'hint': '[ Use decimal type ]', 'target': 'float', 'type': 'sniper'},
                {'display': '_____ ( "Enter second number: " )', 'hint': '[ Input function ]', 'target': 'input', 'type': 'sniper'},
                {'display': 'result = a + b', 'target': 'result = a + b', 'type': 'standard'},
                {'display': 'print ( "Sum:" , res )', 'hint': "[ 'res' doesn't exist — the variable is called 'result' ]", 'isCorrupt': True, 'target': 'print ( "Sum:" , result )', 'type': 'debug'}
            ],
            'tip': 'SIMPLE CALCULATOR',
            'concepts': [{'type': 'Type Casting', 'code': 'float(input("Num:"))'}]
        },
        {
            'expected_output': '> Guess 1 to 10: 7\nCorrect!',
            'id': 3,
            'lines': [
                {'display': 'import random', 'target': 'import random', 'type': 'standard'},
                {'display': '______.randint ( 1 , 10 )', 'hint': '[ Random library ]', 'target': 'random', 'type': 'sniper'},
                {'display': '_____ ( "Guess 1 to 10: " )', 'hint': '[ Input function ]', 'target': 'input', 'type': 'sniper'},
                {'display': 'if guess == secret :', 'target': 'if guess == secret :', 'type': 'standard'},
                {'display': '_____ ( "Correct!" )', 'hint': '[ Output function ]', 'target': 'print', 'type': 'sniper'},
                {'display': 'else :', 'target': 'else :', 'type': 'standard'},
                {'display': '_____ ( f"Wrong! It was {secret}." )', 'hint': '[ Output function ]', 'target': 'print', 'type': 'sniper'}
            ],
            'tip': 'GUESS THE NUMBER',
            'concepts': [{'type': 'Conditionals', 'code': 'if guess == secret:<br>&nbsp;&nbsp;print("Correct")'}]
        },
        {
            'expected_output': '> Add task: milk\n> Add task: done\n\nYour tasks:\n1. milk',
            'id': 4,
            'lines': [
                {'display': 'tasks = [ ]', 'target': 'tasks = [ ]', 'type': 'standard'},
                {'display': 'while True :', 'target': 'while True :', 'type': 'standard'},
                {'display': '_____ ( "Add task (or \'done\' to stop): " )', 'hint': '[ Input function ]', 'target': 'input', 'type': 'sniper'},
                {'display': '__ task == "done" :', 'hint': '[ Complete ]', 'target': 'if', 'type': 'sniper'},
                {'display': '    break', 'target': '    break', 'type': 'standard'},
                {'display': '____________ ( task )', 'hint': '[ Complete ]', 'target': 'tasks.append', 'type': 'sniper'},
                {'display': '_____ ( "Your tasks:" )', 'hint': '[ Output function ]', 'target': 'print', 'type': 'sniper'},
                {'display': '___ i , t in enumerate ( tasks , 1 ) :', 'hint': '[ Complete ]', 'target': 'for', 'type': 'sniper'},
                {'display': '_____ ( f"{i}. {t}" )', 'hint': '[ Output function ]', 'target': 'print', 'type': 'sniper'}
            ],
            'tip': 'TO DO LIST',
            'concepts': [{'type': 'Lists', 'code': 'tasks.append("milk")'}, {'type': 'Loops', 'code': 'while True:<br>&nbsp;&nbsp;break'}]
        },
        {
            'expected_output': '> Name: Ali\n> Phone: 55\n> Name: done\n\nContacts:\nAli: 55\nTotal contacts: 1',
            'id': 5,
            'lines': [
                {'display': 'contacts = { }', 'target': 'contacts = { }', 'type': 'standard'},
                {'display': 'while True :', 'target': 'while True :', 'type': 'standard'},
                {'display': '_____ ( "Enter name (or \'done\'): " )', 'hint': '[ Input function ]', 'target': 'input', 'type': 'sniper'},
                {'display': '__ name == "done" :', 'hint': '[ Complete ]', 'target': 'if', 'type': 'sniper'},
                {'display': '    break', 'target': '    break', 'type': 'standard'},
                {'display': '_____ ( "Enter phone number: " )', 'hint': '[ Input function ]', 'target': 'input', 'type': 'sniper'},
                {'display': '________ [ name ] = phone', 'hint': '[ Complete ]', 'target': 'contacts', 'type': 'sniper'},
                {'display': '_____ ( "Your contacts:" )', 'hint': '[ Output function ]', 'target': 'print', 'type': 'sniper'},
                {'display': '___ name , phone in contacts.items ( ) :', 'hint': '[ Complete ]', 'target': 'for', 'type': 'sniper'},
                {'display': '_____ ( f"{name}: {phone}" )', 'hint': '[ Output function ]', 'target': 'print', 'type': 'sniper'},
                {'display': '_____ ( f"Total contacts: { len ( contacts ) }" )', 'hint': '[ Output function ]', 'target': 'print', 'type': 'sniper'}
            ],
            'tip': 'CONTACT BOOK',
            'concepts': [{'type': 'Dictionaries', 'code': 'contacts["Ali"] = 55'}, {'type': 'Methods', 'code': 'for k, v in dict.items():'}]
        },
        {
            'expected_output': 'ArrayList total: 10',
            'id': 6,
            'lines': [
                {'display': '_________ < Integer > list = new ArrayList < > ( ) ;', 'hint': '[ List type ]', 'target': 'ArrayList', 'type': 'sniper'},
                {'display': 'list . ______ ( 10 ) ;', 'hint': '[ Add item ]', 'target': 'add', 'type': 'sniper'},
                {'display': 'System . out . println ( "ArrayList total: " + list . ______ ( 0 ) ) ;', 'hint': '[ Get item at index ]', 'target': 'get', 'type': 'sniper'}
            ],
            'tip': 'BOSS: UTILITIES',
            'concepts': [{'type': 'Collections', 'code': 'ArrayList<Integer> list = new ArrayList<>();'}]
        },
        {
            'expected_output': 'Error: Index 5 out of bounds',
            'id': 7,
            'lines': [
                {'display': '______ {', 'hint': '[ Start try block ]', 'target': 'try', 'type': 'sniper'},
                {'display': '    int [ ] arr = { 1 , 2 } ;', 'target': '    int [ ] arr = { 1 , 2 } ;', 'type': 'standard'},
                {'display': '    System . out . println ( arr [ 5 ] ) ;', 'target': '    System . out . println ( arr [ 5 ] ) ;', 'type': 'standard'},
                {'display': '} ______ ( Exception e ) {', 'hint': '[ Catch block ]', 'target': 'catch', 'type': 'sniper'},
                {'display': '    System . out . println ( "Error: " + e . getMessage ( ) ) ;', 'target': '    System . out . println ( "Error: " + e . getMessage ( ) ) ;', 'type': 'standard'},
                {'display': '}', 'target': '}', 'type': 'standard'}
            ],
            'tip': 'EXCEPTION SAFETY',
            'concepts': [{'type': 'Exceptions', 'code': 'try { ... } catch (Exception e) { ... }'}]
        },
        {
            'expected_output': '> Input: abc\nError: invalid literal for int()',
            'id': 7,
            'lines': [
                {'display': 'try :', 'target': 'try :', 'type': 'standard'},
                {'display': '    x = _____ ( input ( "Input: " ) )', 'hint': '[ Convert to integer ]', 'target': 'int', 'type': 'sniper'},
                {'display': '______ ValueError as e :', 'hint': '[ Capture error ]', 'target': 'except', 'type': 'sniper'},
                {'display': '    print ( f"Error: {e}" )', 'target': '    print ( f"Error: {e}" )', 'type': 'standard'}
            ],
            'tip': 'DEFENSIVE CODING',
            'concepts': [{'type': 'Exception Handling', 'code': 'try:<br>&nbsp;&nbsp;x = int("abc")<br>except ValueError:<br>&nbsp;&nbsp;pass'}]
        },
        {
            'expected_output': 'File content: Hello from Python!',
            'id': 8,
            'lines': [
                {'display': '____ ( "data.txt" , "r" ) as f :', 'hint': '[ File context manager ]', 'target': 'with open', 'type': 'sniper'},
                {'display': '    content = f . ______ ( )', 'hint': '[ Read entire file ]', 'target': 'read', 'type': 'sniper'},
                {'display': '    print ( f"File content: {content}" )', 'target': '    print ( f"File content: {content}" )', 'type': 'standard'}
            ],
            'tip': 'LOG FILE ANALYSIS',
            'concepts': [{'type': 'File I/O', 'code': 'with open("f.txt", "r") as f:<br>&nbsp;&nbsp;data = f.read()'}]
        }
    ]
}

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session['user_id'] = 0
        return jsonify({
            "status": "success",
            "username": ADMIN_USERNAME,
            "is_admin": True
        })

    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()

        if user and check_password_hash(user['password'], password):
            user_id = user['id']
            session['user_id'] = user_id
            session['username'] = user['username']
            
            # FETCH LIVE SESSION DATA ON LOGIN
            # 1. Total Score
            cursor.execute("SELECT SUM(score) as total FROM scores WHERE user_id=%s", (user_id,))
            total_score = cursor.fetchone()['total'] or 0
            
            # 2. Current Ranks/Badges
            cursor.execute("SELECT language, current_task FROM progress WHERE user_id=%s", (user_id,))
            progress_rows = cursor.fetchall()
            ranks = compute_ranks(progress_rows)
            
            # 3. Total Levels
            total_levels = sum(p['current_task'] - 1 for p in progress_rows)
            
            conn.close() # Close connection after all operations are done
            return jsonify({
                "status": "success",
                "username": user['username'],
                "full_name": user.get('full_name', ''),
                "occupation": user.get('occupation', 'Defender'),
                "email": user.get('email', ''),
                "total_score": int(total_score),
                "total_levels": total_levels,
                "global_rank": ranks['global_rank'],
                "lang_badges": ranks['lang_badges'],
                "is_admin": False
            })
        
        conn.close()
        return jsonify({"status": "fail", "message": "Access Denied"})
    except Exception as e:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
        return jsonify({"status": "error", "message": f"Database Error: {str(e)}"})


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    try:
        email = data.get('email', '').strip()
        # Basic email format check — must contain exactly one @ with content on both sides
        if email and ('@' not in email or email.startswith('@') or email.endswith('@') or '.' not in email.split('@')[-1]):
            return jsonify({"status": "fail", "message": "Invalid email address"})
        if len(data.get('password', '')) < 6:
            return jsonify({"status": "fail", "message": "Password must be at least 6 characters"})
        hashed_password = generate_password_hash(data['password'])
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username=%s", (data['username'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({"status": "fail", "message": "Username already taken"})

        query = (
            "INSERT INTO users (full_name, occupation, email, username, password) "
            "VALUES (%s, %s, %s, %s, %s)"
        )
        cursor.execute(query, (
            data.get('full_name', '').strip(), data.get('occupation', 'Defender').strip(),
            email, data.get('username', '').strip(), hashed_password
        ))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "fail", "message": f"Registration Error: {str(e)}"})



@app.route('/api/get_task/<language>', methods=['GET'])
def get_task(language):
    if 'user_id' not in session: return jsonify({"error": "Auth Error"})
    
    game_mode = request.args.get('mode', 'classic')
    difficulty = request.args.get('difficulty', 'normal')
    req_level = request.args.get('level', type=int)
    db_lang = get_db_lang(language, game_mode, difficulty)
    user_id = session['user_id']

    # ── DB: fetch/init progress (Bypass for Admin ID 0) ────────────────────
    task_index = 1
    if user_id != 0:
        try:
            conn = get_db()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT current_task FROM progress WHERE user_id=%s AND language=%s", (user_id, db_lang))
            row = cursor.fetchone()
            if row:
                task_index = row['current_task']
            else:
                cursor.execute("INSERT INTO progress (user_id, language, current_task) VALUES (%s, %s, 1)", (user_id, db_lang))
                conn.commit()
        except Exception as e:
            return jsonify({"error": f"Database Error: {str(e)}"}), 500
        finally:
            if 'conn' in locals():
                conn.close()

    # Override level if requested
    if req_level and req_level > 0:
        task_index = req_level

    dataset = BUILDER_DATA if game_mode == 'builder' else CLASSIC_DATA
    tasks = dataset.get(language, [])

    # ── Guard: empty task list prevents ZeroDivisionError on modulo ──────
    if not tasks:
        return jsonify({"error": f"No content available for language '{language}' in {game_mode} mode."}), 404

    if task_index > len(tasks): 
        if game_mode == 'builder':
            return jsonify({"game_complete": True})
        else:
            real_index = (task_index - 1) % len(tasks)
            level_data = tasks[real_index]
    else:
        level_data = tasks[task_index - 1]
    
    raw_content = level_data.get("lines", []) if game_mode == 'builder' else level_data.get("words", [])
    is_boss_level = (task_index % 6 == 0 and game_mode == 'builder')
    
    if not isinstance(raw_content, list):
        raw_content = []
        
    # --- GAMIFIED SERIALIZATION ---
    content = []
    for item in raw_content:
        # Support both new dictionary format and legacy string format
        if isinstance(item, str):
            task_obj = {"type": "standard", "display": item, "target": item, "isCorrupt": False}
        else:
            task_obj = item.copy()

        # Handle default corruption rules if not explicitly set
        if "isCorrupt" not in task_obj:
            task_obj["isCorrupt"] = False if task_obj["type"] == "standard" else True
            
        # Backward compatibility for existing frontend
        task_obj["word"] = task_obj["display"]
        task_obj["line"] = task_obj["display"]
        task_obj["corrupt"] = task_obj["isCorrupt"]
        content.append(task_obj)

    if game_mode == 'classic':
        # Apply level-based randomization for keywords
        corruption_rate = 0.2 + (min(task_index, 10) * 0.05)
        if difficulty == 'pro': corruption_rate += 0.2
        
        for item in content:
            if item["type"] == "standard":
                # Randomly corrupt some standard words at higher levels
                if random.random() < (corruption_rate - 0.2):
                    item["isCorrupt"] = True
            else:
                item["isCorrupt"] = True

            item["corrupt"] = item["isCorrupt"]
        random.shuffle(content)
    else:
        # Builder Mode: Pro difficulty adds extra challenge by converting some standard lines to snipers
        if difficulty == 'pro' and not is_boss_level:
            for item in content:
                if item["type"] == "standard" and random.random() < 0.3:
                    item["type"] = "sniper"
                    # Hide part of the target for sniper mode
                    tgt = item["target"]
                    if len(tgt) > 5:
                        item["display"] = tgt[:2] + "______" + tgt[-1:]
                        item["hint"] = "[ Manual override required ]"

        # Ensure at least one line is corrupt unless it's a boss
        has_special = any(item["type"] in ["sniper", "debug"] for item in content)
        has_explicit = any(item["isCorrupt"] for item in content)
        
        if not is_boss_level and not has_special and not has_explicit:
            standard_indices = [i for i, x in enumerate(content) if x["type"] == "standard"]
            if standard_indices:
                c_index = random.choice(standard_indices)
                content[c_index]["isCorrupt"] = True
                content[c_index]["corrupt"] = True

    expected_output = level_data.get("expected_output", "") if game_mode == 'builder' else ""

    # ── NEXUS LEARNING METADATA ──────────────────────────────────────────
    # Maps each level to its concept theme and recommended weapon.
    # Used by nexus_core.js for briefings, tooltips, and weapon hints.
    LEVEL_CONCEPTS = {
        'python': {
            1: {'concept': 'inputs_and_outputs',  'weapon_hint': 'sniper', 'concept_title': 'INPUTS & OUTPUTS'},
            2: {'concept': 'logic_gates',          'weapon_hint': 'fixer',  'concept_title': 'LOGIC GATES'},
            3: {'concept': 'memory_banks',         'weapon_hint': 'blazer', 'concept_title': 'MEMORY BANKS'},
            4: {'concept': 'pattern_matching',     'weapon_hint': 'sniper', 'concept_title': 'PATTERN MATCHING'},
            5: {'concept': 'system_modules',       'weapon_hint': 'sniper', 'concept_title': 'SYSTEM MODULES'},
            6: {'concept': 'full_program',         'weapon_hint': 'any',    'concept_title': 'BOSS: FULL PROGRAM'},
        },
        'java': {
            1: {'concept': 'primitive_types',      'weapon_hint': 'blazer', 'concept_title': 'PRIMITIVE TYPES'},
            2: {'concept': 'access_control',       'weapon_hint': 'fixer',  'concept_title': 'ACCESS CONTROL'},
            3: {'concept': 'flow_control',         'weapon_hint': 'fixer',  'concept_title': 'FLOW CONTROL'},
            4: {'concept': 'objects',              'weapon_hint': 'fixer',  'concept_title': 'OBJECTS'},
            5: {'concept': 'exceptions',           'weapon_hint': 'sniper', 'concept_title': 'EXCEPTIONS'},
            6: {'concept': 'full_program',         'weapon_hint': 'any',    'concept_title': 'BOSS: FULL SYNTAX'},
        },
        'c': {
            1: {'concept': 'data_types',           'weapon_hint': 'blazer', 'concept_title': 'DATA TYPES'},
            2: {'concept': 'preprocessor',         'weapon_hint': 'sniper', 'concept_title': 'PREPROCESSOR'},
            3: {'concept': 'pointers',             'weapon_hint': 'blazer', 'concept_title': 'POINTERS'},
            4: {'concept': 'io_streams',           'weapon_hint': 'sniper', 'concept_title': 'I/O STREAMS'},
            5: {'concept': 'memory_management',    'weapon_hint': 'blazer', 'concept_title': 'MEMORY MANAGEMENT'},
            6: {'concept': 'full_program',         'weapon_hint': 'any',    'concept_title': 'BOSS: STRUCT + LOOP'},
        },
    }
    lang_concepts = LEVEL_CONCEPTS.get(language, {})
    # Use modulo so it wraps correctly on repeated play
    concept_idx = ((task_index - 1) % 6) + 1
    nexus_meta = lang_concepts.get(concept_idx, {'concept': 'general', 'weapon_hint': 'any', 'concept_title': f'LEVEL {task_index}'})
    
    if game_mode == 'classic':
        # FINAL SANITIZATION: Forcefully strip any items that are corrupt, non-standard, or have hints.
        # This acts as a catch-all safety net that runs AFTER all difficulty/randomization logic.
        content = [item for item in content if not item.get('isCorrupt') and not item.get('hint') and item.get('type') == 'standard']
        # Explicitly ensure nothing surviving has an accidental corruption flag
        for item in content:
            item["isCorrupt"] = False
            item["corrupt"] = False

    return jsonify({
        "game_complete": False,
        "id": task_index,
        "tip": level_data["tip"],
        "content": content,
        "mode": game_mode,
        "is_boss": is_boss_level,
        "expected_output": expected_output,
        "concepts": level_data.get("concepts", []),
        # NEXUS learning fields
        "concept": nexus_meta['concept'],
        "concept_title": nexus_meta['concept_title'],
        "weapon_hint": nexus_meta['weapon_hint'],
        "level_theme": nexus_meta['concept_title'],
    })


# ── RANK COMPUTATION ─────────────────────────────────────────────────────────
# Language rank: based on max level cleared across ALL modes/difficulties for that language
LANG_RANKS = [
    # (min_level_cleared, rank_name, rank_icon, rank_color)
    (0,  'Initiate',  '🔵', '#4a8fff'),
    (1,  'Cadet',     '🟢', '#39ff8f'),
    (3,  'Defender',  '🟡', '#ffd60a'),
    (6,  'Veteran',   '🟠', '#ff8c00'),
    (6,  'Elite',     '💜', '#b44fff'),  # Only via Pro Mode clear
]

GLOBAL_RANKS = [
    # (condition_fn, rank_name, rank_icon, rank_color)
    ('recruit',   'Recruit',    '🔵', '#4a8fff'),
    ('cadet',     'Cadet',      '🟢', '#39ff8f'),
    ('defender',  'Defender',   '🟡', '#ffd60a'),
    ('specialist','Specialist', '🟠', '#ff8c00'),
    ('veteran',   'Veteran',    '🔴', '#ff4d6d'),
    ('pro',       'Pro',        '💜', '#b44fff'),
    ('elite',     'Elite',      '⚡', '#00d4ff'),
    ('phantom',   'Phantom',    '💀', '#ffffff'),
]

def compute_ranks(progress_rows):
    """
    progress_rows: list of dicts with keys: language(db_lang), current_task
    Returns: { lang_badges: {python:.., java:.., c:..}, global_rank: {...} }
    """
    langs = ['python', 'java', 'c']
    modes = ['classic', 'builder']
    diffs = ['normal', 'pro']

    # Build a lookup: (lang, mode, diff) -> max_level_completed
    # current_task in progress = next level to play, so completed = current_task - 1
    progress_map = {}
    for row in progress_rows:
        progress_map[row['language']] = max(0, row['current_task'] - 1)

    # Compute per-language stats
    lang_stats = {}  # lang -> {max_normal, max_pro, has_pro_complete}
    for lang in langs:
        max_normal = 0
        max_pro = 0
        for mode in modes:
            for diff in diffs:
                db_lang = get_db_lang(lang, mode, diff)
                lvls = progress_map.get(db_lang, 0)
                if diff == 'pro':
                    max_pro = max(max_pro, lvls)
                else:
                    max_normal = max(max_normal, lvls)
        lang_stats[lang] = {'max_normal': max_normal, 'max_pro': max_pro}

    # Assign language badge
    def lang_badge(stats):
        mn, mp = stats['max_normal'], stats['max_pro']
        if mp >= 6:
            return {'name': 'Elite',    'icon': '⚡', 'color': '#00d4ff', 'level': 5}
        if mp >= 1:
            return {'name': 'Veteran',  'icon': '🔴', 'color': '#ff4d6d', 'level': 4}
        if mn >= 6:
            return {'name': 'Defender', 'icon': '🟡', 'color': '#ffd60a', 'level': 3}
        if mn >= 3:
            return {'name': 'Cadet',    'icon': '🟢', 'color': '#39ff8f', 'level': 2}
        if mn >= 1:
            return {'name': 'Initiate', 'icon': '🔵', 'color': '#4a8fff', 'level': 1}
        return      {'name': 'Recruit', 'icon': '⬡',  'color': '#4a6080', 'level': 0}

    lang_badges = {lang: lang_badge(lang_stats[lang]) for lang in langs}
    badge_levels = [lang_badges[l]['level'] for l in langs]
    pro_clears = [lang_stats[l]['max_pro'] >= 6 for l in langs]

    # Compute global rank
    if all(pro_clears):
        g = {'name': 'Phantom',   'icon': '💀', 'color': '#ffffff',  'tier': 7}
    elif any(pro_clears):
        g = {'name': 'Elite',     'icon': '⚡',  'color': '#00d4ff', 'tier': 6}
    elif any(int(lang_stats[l]['max_pro']) >= 1 for l in langs):
        g = {'name': 'Pro',       'icon': '💜', 'color': '#b44fff',  'tier': 5}
    elif all(int(b) >= 3 for b in badge_levels):
        g = {'name': 'Specialist','icon': '🟠', 'color': '#ff8c00',  'tier': 4}
    elif any(int(b) >= 3 for b in badge_levels):
        g = {'name': 'Defender',  'icon': '🟡', 'color': '#ffd60a',  'tier': 3}
    elif any(int(b) >= 1 for b in badge_levels):
        g = {'name': 'Cadet',     'icon': '🟢', 'color': '#39ff8f',  'tier': 2}
    else:
        g = {'name': 'Recruit',   'icon': '🔵', 'color': '#4a8fff',  'tier': 1}

    return {'lang_badges': lang_badges, 'global_rank': g}


@app.route('/api/complete_level', methods=['POST'])
def complete_level():
    """Records a level completion. Advances progress. Idempotent."""
    if 'user_id' not in session:
        return jsonify({"error": "Auth Error"}), 401
    data = request.json
    language = data.get('language', 'python')
    mode = data.get('mode', 'classic')
    difficulty = data.get('difficulty', 'normal')
    level_id = int(data.get('level_id', 1))
    db_lang = get_db_lang(language, mode, difficulty)
    user_id = session['user_id']
    # ── DB: Complete Level (Bypass for Admin ID 0) ────────────────────────
    if user_id == 0:
        return jsonify({"status": "success", "rank": None})
    try:
        conn = get_db(); cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT current_task FROM progress WHERE user_id=%s AND language=%s", (user_id, db_lang))
        row = cursor.fetchone()
        if row:
            # Only advance if this level hasn't been surpassed yet (idempotent)
            if row['current_task'] <= level_id:
                cursor.execute(
                    "UPDATE progress SET current_task=%s WHERE user_id=%s AND language=%s",
                    (level_id + 1, user_id, db_lang)
                )
        else:
            cursor.execute(
                "INSERT INTO progress (user_id, language, current_task) VALUES (%s, %s, %s)",
                (user_id, db_lang, level_id + 1)
            )
        conn.commit()

        # ── NEW: Record Session Stats ──
        words = int(data.get('words_typed', 0))
        keys_total = int(data.get('keys_total', 0))
        keys_hit = int(data.get('keys_hit', 0))
        duration_ms = int(data.get('duration_ms', 0))

        if words > 0 or keys_total > 0 or duration_ms > 0:
            cursor.execute(
                "UPDATE users SET total_words_typed = total_words_typed + %s, "
                "total_keys_total = total_keys_total + %s, "
                "total_keys_hit = total_keys_hit + %s, "
                "total_play_time_ms = total_play_time_ms + %s "
                "WHERE id = %s",
                (words, keys_total, keys_hit, duration_ms, user_id)
            )
            conn.commit()

        # Return updated ranks
        cursor2 = conn.cursor(dictionary=True)
        cursor2.execute("SELECT language, current_task FROM progress WHERE user_id=%s", (user_id,))
        all_progress = cursor2.fetchall()
        conn.close()
        ranks = compute_ranks(all_progress)
        return jsonify({"status": "success", **ranks})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/api/flush_words', methods=['POST'])
def flush_words():
    """Persists session word/key stats to DB without advancing level progress (used on abort/breach)."""
    if 'user_id' not in session:
        return jsonify({"status": "ok"})
    user_id = session['user_id']
    if user_id == 0:
        return jsonify({"status": "ok"})
    try:
        data = request.json or {}
        words = max(0, int(data.get('words_typed', 0)))
        keys_total = max(0, int(data.get('keys_total', 0)))
        keys_hit = max(0, int(data.get('keys_hit', 0)))
        if words == 0 and keys_total == 0:
            return jsonify({"status": "ok"})
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET total_words_typed = total_words_typed + %s, "
            "total_keys_total = total_keys_total + %s, "
            "total_keys_hit = total_keys_hit + %s "
            "WHERE id = %s",
            (words, keys_total, keys_hit, user_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})
    except Exception:
        return jsonify({"status": "ok"})


@app.route('/api/update_score', methods=['POST'])
def update_score():
    """Updates user high score for a specific level."""
    if 'user_id' not in session:
        return jsonify({"error": "Auth Error"}), 401
    data = request.json
    points = int(data.get('points', 0))
    language = data.get('language', 'python')
    mode = data.get('mode', 'classic')
    difficulty = data.get('difficulty', 'normal')
    level_id = int(data.get('level_id', 1))
    db_lang = get_db_lang(language, mode, difficulty)
    level_key = f"{db_lang}_{level_id}"
    user_id = session['user_id']
    
    if user_id == 0:
        return jsonify({"status": "success", "score": points})
    try:
        conn = get_db(); cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT score FROM scores WHERE user_id=%s AND language=%s", (user_id, level_key))
        row = cursor.fetchone()
        if row:
            new_score = max(points, row['score'])
            cursor.execute("UPDATE scores SET score=%s WHERE user_id=%s AND language=%s", (new_score, user_id, level_key))
        else:
            new_score = max(0, points)
            cursor.execute("INSERT INTO scores (user_id, language, score) VALUES (%s, %s, %s)", (user_id, level_key, new_score))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "score": new_score})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/api/my_scores')
def my_scores():
    """Returns a dict of all high scores for the current user in a specific context."""
    if 'user_id' not in session:
        return jsonify({"scores": {}})
    language = request.args.get('lang', 'python')
    mode = request.args.get('mode', 'classic')
    difficulty = request.args.get('difficulty', 'normal')
    db_lang = get_db_lang(language, mode, difficulty)
    user_id = session['user_id']
    if user_id == 0:
        return jsonify({"scores": {}})
    try:
        conn = get_db(); cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT language, score FROM scores WHERE user_id=%s AND language LIKE %s", (user_id, f"{db_lang}\_%"))
        rows = cursor.fetchall()
        conn.close()
        
        score_map = {}
        for r in rows:
            try:
                lvl = int(r['language'].split('_')[-1])
                score_map[lvl] = r['score']
            except:
                pass
        return jsonify({"scores": score_map})
    except:
        return jsonify({"scores": {}})


@app.route('/api/reset_progress', methods=['POST'])
def reset_progress():
    """Resets progress and score for a specific context."""
    if 'user_id' not in session:
        return jsonify({"error": "Auth Error"}), 401
    data = request.json
    language = data.get('language', 'python')
    mode = data.get('mode', 'classic')
    difficulty = data.get('difficulty', 'normal')
    db_lang = get_db_lang(language, mode, difficulty)
    user_id = session['user_id']
    if user_id == 0:
        return jsonify({"status": "success"})
    try:
        conn = get_db(); cursor = conn.cursor()
        cursor.execute("DELETE FROM progress WHERE user_id=%s AND language=%s", (user_id, db_lang))
        cursor.execute("DELETE FROM scores WHERE user_id=%s AND language LIKE %s", (user_id, f"{db_lang}%"))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


def get_leaderboard_data():
    """Helper to get all users and their ranks, sorted by global tier."""
    try:
        conn = get_db(); cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, avatar, occupation, total_words_typed FROM users")
        users = cursor.fetchall()
        cursor.execute("SELECT user_id, language, current_task FROM progress")
        all_progress = cursor.fetchall()

        # Fetch all scores at once
        cursor.execute("SELECT user_id, language, score FROM scores")
        all_scores = cursor.fetchall()

        result = []
        for user in users:
            uid = user['id']
            user_prog = [r for r in all_progress if r['user_id'] == uid]

            if len(user_prog) == 0:
                continue

            ranks = compute_ranks(user_prog)
            total_levels = sum(p['current_task'] - 1 for p in user_prog)

            # Total score from scores table
            user_scores = [s for s in all_scores if s['user_id'] == uid]
            total_score = sum(s['score'] for s in user_scores)

            # Build lang_progress (same structure as /api/my_profile)
            lang_progress = {}
            for lang in ['python', 'java', 'c']:
                lang_progress[lang] = {}
                for mode in ['classic', 'builder']:
                    lang_progress[lang][mode] = {}
                    for diff in ['normal', 'pro']:
                        db_lang = get_db_lang(lang, mode, diff)
                        ml = len((BUILDER_DATA if mode == 'builder' else CLASSIC_DATA).get(lang, []))
                        lc = 0
                        for p in user_prog:
                            if p['language'] == db_lang:
                                lc = min(max(0, p['current_task'] - 1), ml)
                        bs = sum(s['score'] for s in user_scores if s['language'] == db_lang)
                        lang_progress[lang][mode][diff] = {
                            'levels_completed': lc,
                            'best_score': bs
                        }

            result.append({
                'id': uid,
                'username': user['username'],
                'avatar': user.get('avatar') or '',
                'occupation': user.get('occupation') or 'Defender',
                'total_words_typed': int(user.get('total_words_typed') or 0),
                'global_rank': ranks['global_rank'],
                'lang_badges': ranks['lang_badges'],
                'lang_progress': lang_progress,
                'total_levels': total_levels,
                'total_score': int(total_score),
                'sort_val': (ranks['global_rank']['tier'], total_levels)
            })

        # Sort by global rank tier, then total levels completed
        result.sort(key=lambda x: x['sort_val'], reverse=True)
        for r in result:
            del r['sort_val']

        return result
    except Exception as e:
        print(f"Leaderboard Error: {e}")
        return []
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


@app.route('/api/my_rank')
def my_rank():
    """Returns language badges, global rank, and numeric positions for the current user."""
    if 'user_id' not in session:
        return jsonify({**compute_ranks([]), 'global_pos': 0, 'lang_pos': {}, 'total_levels': 0, 'total_score': 0})
    
    user_id = session['user_id']
    if (user_id == 0):
        return jsonify({**compute_ranks([]), 'global_pos': 0, 'lang_pos': {}, 'total_levels': 0, 'total_score': 0})
    
    try:
        leaderboard = get_leaderboard_data()
        
        # Find global position
        global_pos = 0
        user_ranks = None
        for i, entry in enumerate(leaderboard):
            if entry['id'] == user_id:
                global_pos = i + 1
                user_ranks = entry
                break
        
        if not user_ranks:
            # Fallback if user not in leaderboard yet
            return jsonify({**compute_ranks([]), 'global_pos': 0, 'lang_pos': {}, 'total_levels': 0, 'total_score': 0})

        # Language positions
        lang_pos = {}
        for lang in ['python', 'java', 'c']:
            # Sort all users by this specific language level
            # We need the raw progress for this, or just the level from the badge
            # Let's use the level from the badge for simplicity in ties
            sorted_lang = sorted(leaderboard, key=lambda x: x['lang_badges'][lang]['level'], reverse=True)
            for i, entry in enumerate(sorted_lang):
                if entry['id'] == user_id:
                    lang_pos[lang] = i + 1
                    break
        
        return jsonify({
            'global_rank': user_ranks['global_rank'],
            'lang_badges': user_ranks['lang_badges'],
            'global_pos': global_pos,
            'lang_pos': lang_pos,
            'total_levels': user_ranks['total_levels'],
            'total_score': user_ranks['total_score']
        })
    except Exception as e:
        return jsonify({**compute_ranks([]), 'global_pos': 0, 'lang_pos': {}, 'total_levels': 0, 'total_score': 0})


@app.route('/api/start_game', methods=['POST'])
def start_game():
    """Simple stub for session start tracking."""
    return jsonify({"status": "success", "session_id": os.urandom(8).hex()})


@app.route('/api/tutorial_done', methods=['POST'])
def tutorial_done():
    """Marks that the current user has completed the onboarding tutorial."""
    if 'user_id' not in session:
        return jsonify({"status": "ok"})
    user_id = session['user_id']
    if user_id == 0:
        return jsonify({"status": "ok"})
    try:
        conn = get_db()
        cursor = conn.cursor()
        # Add has_seen_tutorial column if it doesn't exist yet (safe idempotent ALTER)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN has_seen_tutorial TINYINT(1) DEFAULT 0")
            conn.commit()
        except Exception:
            pass  # Column already exists — ignore
        cursor.execute("UPDATE users SET has_seen_tutorial=1 WHERE id=%s", (user_id,))
        conn.commit()
        conn.close()
    except Exception:
        pass
    return jsonify({"status": "ok"})

@app.route('/api/leaderboard_all')
def leaderboard_all():
    """Returns per-language rank leaderboard instead of raw points."""
    leaderboard = get_leaderboard_data()
    return jsonify({'leaderboard': leaderboard})


@app.route('/api/leaderboard')
def leaderboard_filtered():
    """
    Returns leaderboard filtered by mode, difficulty, and language.
    Query params: mode, difficulty, lang
    The frontend calls /api/leaderboard?mode=...&difficulty=...&lang=...
    from fetchLBSpecific() in game.js. Without this route the Specific
    Rankings tab always showed an empty grid (404 silently swallowed by
    apiFetch).
    """
    mode       = request.args.get('mode', 'classic')
    difficulty = request.args.get('difficulty', 'normal')
    lang       = request.args.get('lang', 'python')
    db_lang    = get_db_lang(lang, mode, difficulty)

    try:
        conn   = get_db()
        cursor = conn.cursor(dictionary=True)
        # Get all users with a score entry for this specific context
        cursor.execute(
            "SELECT u.id, u.username, s.score "
            "FROM users u JOIN scores s ON u.id = s.user_id "
            "WHERE s.language = %s "
            "ORDER BY s.score DESC",
            (db_lang,)
        )
        rows = cursor.fetchall()
        conn.close()

        # Enrich with global rank data so the frontend card renderer works
        all_lb = get_leaderboard_data()
        rank_map = {e['id']: e for e in all_lb}

        result = []
        for row in rows:
            uid  = row['id']
            base = rank_map.get(uid, {})
            result.append({
                'username':    row['username'],
                'points':      row['score'],
                'global_rank': base.get('global_rank', {'name': 'Recruit', 'icon': '⬡', 'color': '#4a6080', 'tier': 1}),
                'lang_badges': base.get('lang_badges', {}),
            })
        return jsonify({'leaderboard': result})
    except Exception as e:
        return jsonify({'leaderboard': [], 'error': str(e)})



@app.route('/api/my_profile')
def my_profile():
    """Returns comprehensive profile data for the current user."""
    if 'user_id' not in session:
        return jsonify({"status": "fail", "message": "Not authenticated"}), 401

    user_id = session['user_id']
    if user_id == 0:
        return jsonify({
            "status": "success",
            "username": "ADMIN",
            "occupation": "System Administrator",
            "member_since": "2024-01-01",
            "total_score": 0,
            "total_levels": 0,
            "sessions_played": 0,
            "global_pos": 0,
            "lang_pos": {},
            "global_rank": {"name": "Phantom", "icon": "💀", "color": "#ffffff", "tier": 7},
            "lang_badges": {},
            "lang_progress": {}
        })

    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Basic user info
        try:
            cursor.execute("SELECT username, occupation, created_at, total_words_typed, total_keys_total, total_keys_hit, total_play_time_ms FROM users WHERE id=%s", (user_id,))
        except Exception:
            cursor.execute("SELECT username, occupation FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({"status": "fail", "message": "User not found"}), 404

        # Calculate Lifetime Stats
        tw = user.get('total_words_typed', 0) or 0
        tk_total = user.get('total_keys_total', 0) or 0
        tk_hit = user.get('total_keys_hit', 0) or 0
        tp_time_ms = user.get('total_play_time_ms', 0) or 0

        # Accuracy = hit / total
        accuracy = round((tk_hit / tk_total * 100)) if tk_total > 0 else 0
        # WPM = words / (minutes)
        wpm = round(tw / (tp_time_ms / 60000)) if tp_time_ms > 60000 else 0

        member_since = ""
        if user.get('created_at'):
            try:
                member_since = user['created_at'].strftime('%m.%d.%Y')
            except:
                member_since = str(user['created_at'])[:10]

        # All progress rows
        cursor.execute("SELECT language, current_task FROM progress WHERE user_id=%s", (user_id,))
        progress_rows = cursor.fetchall()

        # All scores
        cursor.execute("SELECT language, score FROM scores WHERE user_id=%s", (user_id,))
        score_rows = cursor.fetchall()

        # Sessions played = number of distinct progress tracks (each language/mode/diff is one track)
        sessions_played = len(progress_rows)

        # Compute ranks
        ranks = compute_ranks(progress_rows)

        # Build per-language, per-mode, per-difficulty breakdown
        langs = ['python', 'java', 'c']
        # Map language name to dataset key (CLASSIC_DATA/BUILDER_DATA use 'c', 'java', 'python')
        lang_key_map = {'python': 'python', 'java': 'java', 'c': 'c'}
        modes = ['classic', 'builder']
        diffs = ['normal', 'pro']
        lang_progress = {}
        total_score = 0

        for lang in langs:
            lang_progress[lang] = {}
            for mode in modes:
                lang_progress[lang][mode] = {}
                dataset = BUILDER_DATA if mode == 'builder' else CLASSIC_DATA
                max_levels = len(dataset.get(lang_key_map[lang], []))
                for diff in diffs:
                    db_lang = get_db_lang(lang, mode, diff)

                    # Levels completed — capped at actual dataset size
                    lvl_completed = 0
                    for p in progress_rows:
                        if p['language'] == db_lang:
                            lvl_completed = min(max(0, p['current_task'] - 1), max_levels)

                    # Best score: match both legacy 'py_c_n' and per-level 'py_c_n_1' rows
                    best_score = 0
                    for s in score_rows:
                        slang = s['language']
                        # Match exact track key (legacy) OR level-keyed entries (py_c_n_1, py_c_n_2...)
                        if slang == db_lang or slang.startswith(db_lang + '_'):
                            best_score += s['score']

                    lang_progress[lang][mode][diff] = {
                        'levels_completed': lvl_completed,
                        'best_score': best_score
                    }

        # Total score = sum across all score rows for this user
        total_score = sum(s['score'] for s in score_rows)
        # Total levels completed = sum across all tracks (capped per track at max_levels above)
        total_levels = sum(
            lang_progress[lg][md][df]['levels_completed']
            for lg in langs for md in modes for df in diffs
        )

        # Global leaderboard position (to derive global_pos and lang_pos)
        leaderboard = get_leaderboard_data()
        global_pos = 0
        lang_pos = {}
        for i, entry in enumerate(leaderboard):
            if entry['id'] == user_id:
                global_pos = i + 1
                break
        for lang in langs:
            sorted_lang = sorted(leaderboard, key=lambda x: x['lang_badges'][lang]['level'], reverse=True)
            for i, entry in enumerate(sorted_lang):
                if entry['id'] == user_id:
                    lang_pos[lang] = i + 1
                    break

        conn.close()
        return jsonify({
            "status": "success",
            "username": user['username'],
            "occupation": user.get('occupation', 'Defender'),
            "member_since": member_since,
            "total_score": int(total_score),
            "total_levels": total_levels,
            "sessions_played": sessions_played,
            "global_pos": global_pos,
            "lang_pos": lang_pos,
            "global_rank": ranks['global_rank'],
            "lang_badges": ranks['lang_badges'],
            "lang_progress": lang_progress,
            "lifetime_accuracy": accuracy,
            "lifetime_wpm": wpm,
            "total_words_typed": int(tw)
        })
    except Exception as e:
        if 'conn' in locals() and conn.is_connected():
            conn.close()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "success"})


@app.route('/api/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        # Get latest user details
        try:
            conn = get_db()
            cursor = conn.cursor(dictionary=True)
            if session['user_id'] == 0:
                user = {"username": ADMIN_USERNAME, "full_name": "System Administrator", "occupation": "Admin", "id": 0}
            else:
                cursor.execute("SELECT * FROM users WHERE id=%s", (session['user_id'],))
                user = cursor.fetchone()
            
            if user:
                user_id = user['id']
                # FETCH LIVE SESSION DATA ON REFRESH
                cursor.execute("SELECT SUM(score) as total FROM scores WHERE user_id=%s", (user_id,))
                total_score = cursor.fetchone()['total'] or 0
                
                cursor.execute("SELECT language, current_task FROM progress WHERE user_id=%s", (user_id,))
                progress_rows = cursor.fetchall()
                ranks = compute_ranks(progress_rows)
                
                total_levels = sum(p['current_task'] - 1 for p in progress_rows)
                
                conn.close()
                return jsonify({
                    "status": "success",
                    "username": user['username'],
                    "full_name": user.get('full_name', ''),
                    "occupation": user.get('occupation', 'Defender'),
                    "total_score": int(total_score),
                    "total_levels": total_levels,
                    "global_rank": ranks['global_rank'],
                    "lang_badges": ranks['lang_badges'],
                    "is_admin": session['user_id'] == 0
                })
            conn.close()
        except:
            if 'conn' in locals() and conn.is_connected():
                conn.close()
    return jsonify({"status": "fail"})


@app.route('/api/admin/level_stats', methods=['GET'])
def admin_level_stats():
    if session.get('user_id') != 0:
        return jsonify({"error": "Admin Access Required"}), 403
    
    stats = {}
    languages = ['python', 'java', 'c']
    for lang in languages:
        stats[lang] = {
            'classic_normal': len(CLASSIC_DATA.get(lang, [])),
            'classic_pro': len(CLASSIC_DATA.get(lang, [])),
            'builder_normal': len(BUILDER_DATA.get(lang, [])),
            'builder_pro': len(BUILDER_DATA.get(lang, []))
        }
    return jsonify(stats)


@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    if session.get('user_id') != 0:
        return jsonify({"error": "Admin Access Required"}), 403
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, full_name, occupation, email, username FROM users")
        users = cursor.fetchall()
        cursor.execute("SELECT user_id, language, score FROM scores")
        scores = cursor.fetchall()
        cursor.execute("SELECT user_id, language, current_task FROM progress")
        progress = cursor.fetchall()
        conn.close()

        for user in users:
            user_id = user['id']
            user['stats'] = []
            user_scores = [s for s in scores if s['user_id'] == user_id]
            user_progress = [p for p in progress if p['user_id'] == user_id]
            
            db_langs_full = [
                (l, m, d) for l in ['python', 'java', 'c']
                for m in ['classic', 'builder']
                for d in ['normal', 'pro']
            ]
            for l, m, d in db_langs_full:
                db_lang = get_db_lang(l, m, d)
                frontend_key = f"{l}_{m}_{d}"
                score = next((s['score'] for s in user_scores if s['language'] == db_lang), 0)
                task = next((p['current_task'] for p in user_progress if p['language'] == db_lang), 1)
                if score > 0 or task > 1:
                    user['stats'].append({'mode': frontend_key, 'score': score, 'level': task})

        return jsonify({"status": "success", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/sandbox', methods=['POST'])
def sandbox_execute():
    data = request.json
    language = data.get('language', 'python')
    code = data.get('code', '')
    
    import urllib.request
    import json
    import time
    
    stdout = ""
    stderr = ""
    compileErr = ""
    
    # Map frontend IDs to Paiza IDs
    lang_map = {
        'python': 'python3',
        'java': 'java',
        'c': 'c'
    }
    
    paiza_lang = lang_map.get(language)
    if not paiza_lang:
        return jsonify({"stdout": "", "stderr": f"Unsupported language: {language}", "compileErr": ""})

    # JAVA CLOUD FIX: Cloud runners (Paiza) typically expect 'Main.java' in the root.
    # We must strip 'package' declarations and rename the primary class to 'Main'.
    if language == 'java':
        import re
        # Remove package declarations
        code = re.sub(r'package\s+[\w\.]+;', '', code)
        # Replaces 'public class MyClass' or 'class MyClass' with 'public class Main'
        code = re.sub(r'(?:public\s+)?class\s+\w+', 'public class Main', code, count=1)
    
    # C/C++ source code often requires a trailing newline to avoid compiler warnings
    if language in ['c', 'cpp'] and not code.endswith('\n'):
        code += '\n'

    try:
        url_create = "https://api.paiza.io/runners/create"
        p_create = {"source_code": code, "language": paiza_lang, "api_key": "guest"}
        
        # 1. Create Runner
        req = urllib.request.Request(url_create, data=json.dumps(p_create).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            run_id = json.loads(r.read()).get('id')
        
        if run_id:
            # 2. Poll for Result
            completed = False
            for _ in range(10):
                time.sleep(0.5)
                url_get = f"https://api.paiza.io/runners/get_details?id={run_id}&api_key=guest"
                with urllib.request.urlopen(url_get, timeout=5) as r2:
                    res2 = json.loads(r2.read())
                    if res2.get('status') == 'completed':
                        stdout = res2.get('stdout', '')
                        stderr = res2.get('stderr', '')
                        compileErr = res2.get('build_stderr', '')
                        completed = True
                        break
            if not completed:
                stderr = "Execution timed out (Cloud API)."
        else:
            stderr = "Cloud API Error: Failed to initialize runner."
            
        return jsonify({
            "stdout": str(stdout or "").strip(),
            "stderr": str(stderr or "").strip(),
            "compileErr": str(compileErr or "").strip()
        })
    except Exception as e:
        return jsonify({"stdout": "", "stderr": str(e), "compileErr": ""})

if __name__ == '__main__':
    app.run(debug=True)