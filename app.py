import requests
from flask import *
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('static', path)

messages = []

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

if __name__ == '__main__':
    app.run(debug=True)
