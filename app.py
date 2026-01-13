
from flask import *
from flask_cors import CORS
import random
import string

app = Flask(__name__)
CORS(app) 

user_sessions = {}
regional_chat_rooms = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming"
]

topical_chat_rooms = [
    "Tech", "Science", "Gaming", "Movies", "Music", "Books", "Current Events", 
]   

messages = {}

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('static', path)

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    global messages
    if request.method == 'POST':
        new_message = request.json.get('message')
        if new_message:
            messages.append(new_message)

            # Limit the chat history to the last 11 messages
            if len(messages) > 100:
                messages = messages[-100:]

    return jsonify(messages)

def generate_user_key(length=16):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({'error': 'No username provided'}), 400

    if username in user_sessions:
        return jsonify({'error': 'Username taken'}), 409

    user_key = generate_user_key()
    user_sessions[username] = user_key

    return jsonify({'username': username, 'key': user_key})

@app.route('/validate', methods=['POST'])
def validate():
    data = request.json
    username = data.get('username')
    key = data.get('key')

    if username and key and user_sessions.get(username) == key:
        return jsonify({'status': 'valid'})
    return jsonify({'error': 'Invalid credentials'}), 403

@app.route('/rooms')
def get_rooms():
    return jsonify({
        'regional': regional_chat_rooms,
        'topical': topical_chat_rooms
    })

@app.route('/chat/<room>', methods=['GET', 'POST'])
def chat_room(room):
    room = room.strip()
    if room not in messages:
        messages[room] = []

    if request.method == 'POST':
        data = request.json
        message = {
            'username': data.get('username'),
            'text': data.get('text')
        }
        messages[room].append(message)
        if len(messages[room]) > 100:
            messages[room] = messages[room][-100:]

    return jsonify(messages[room])

if __name__ == '__main__':
    app.run(debug=True)
