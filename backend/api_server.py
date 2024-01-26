"""
Starts the backend api server that communicates with openAI
"""
import json
import os
import gc
from time import time
from argparse import ArgumentParser
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from openai import OpenAI

from helper import (
    append_session_to_file,
    get_uuid,
    print_current_sessions,
    print_verbose,
    save_log_to_jsonl,
)

from reader import update_metadata

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

SESSIONS = dict()
app = Flask(__name__)
CORS(app)

client = OpenAI()
assistant_id = "asst_wGnLMklJXCbUvyF3myAdAVCf"
my_assistant = client.beta.assistants.retrieve(assistant_id=assistant_id)

SUCCESS = True
FAILURE = False

def wait_on_run(run,thread):
    while run.status == "queued" or run.status == "in_progress":
        run = client.beta.threads.retrieve(
            thread_id=thread.id,
            run_id=run.id
        )
        time.sleep(0.5)
    return run

@app.route("/api/start_session", methods=["POST"])
@cross_origin(origin="*")
def start_session():
    """Starts a session for a user"""
    content = request.json
    result = {}

    session_id = get_uuid()
    verification_code = session_id
    thread = client.beta.threads.create()

    # Information returned to the user
    result = {
        "session_id": session_id,
        "thread_id": thread.id,
        "created_at": thread.created_at,
    }

    # Information Stored on server
    SESSIONS[session_id] = {
        "session_id": session_id,
        "start_timestamp": time(),
        "last_query_timestamp": time(),
        "verification_code": verification_code,
        "thread_id": thread.id,
    }

    result["status"] = SUCCESS
    session = SESSIONS[session_id]

    append_session_to_file(session, metadata_path)
    print_verbose("New Session created", session, verbose)
    print_current_sessions(SESSIONS, f"Session {session_id} has started successfully")
    gc.collect(generation=2)
    return jsonify(result)


@app.route("/api/end_session", methods=["POST"])
@cross_origin(origin="*")
def end_session():
    content = request.json
    session_id = content["sessionId"]
    log = content["logs"]

    path = os.path.join(proj_dir, session_id) + ".jsonl"

    results = {}
    results["path"] = path
    try:
        save_log_to_jsonl(path, log)
        results["status"] = SUCCESS
    except Exception as e:
        results["status"] = FAILURE
        results["message"] = str(e)
        print(e)
    print_verbose(
        "Save log to file",
        {
            "session_id": session_id,
            "len(log)": len(log),
            "status": results["status"],
        },
        verbose,
    )

    # Remove a finished session
    try:
        # NOTE: Somehow end_session is called twice;
        # Do not pop session_id from SESSIONS to prevent exception
        session = SESSIONS[session_id]
        results["verification_code"] = session["verification_code"]
        print_current_sessions(
            SESSIONS, f"Session {session_id} has been saved successfully."
        )
    except Exception as e:
        print(e)
        print("# Error at the end of end_session; ignore")
        results["verification_code"] = "SERVER_ERROR"
        print_current_sessions(SESSIONS, f"Session {session_id} has not been saved.")

    gc.collect(generation=2)
    return jsonify(results)


@app.route("/api/chat", methods=["POST"])
@cross_origin(origin="*")
def chat():
    """Chat with the assistant"""
    # Get thread ID
    content = request.json
    result = {}
    session_id = content["session_id"]
    thread_id = content["thread_id"]
    message_content = content["message_content"]
    instruction = content["instruction"]

    thread = client.beta.threads.retrieve(thread_id=thread_id)
    #  Add message to thread
    message = client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=message_content
    )

    
    # Run it with the assistant
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=assistant_id,
        instructions=instruction,
    )
    
    run = wait_on_run(run,thread)
    
    messages = client.beta.threads.messages.list(thread_id=thread_id)
    
    result["response"] = messages
    if run.status == 'failed' or run.status == 'expired':
        result["status"] = FAILURE
    elif run.status == 'completed':
        result["status"] = SUCCESS
    
    return jsonify(result)

@app.route("/api/query", methods=["POST"])
@cross_origin(origin="*")
def query():
    """Query the assistant"""
    # Get thread ID
    content = request.json
    result = {}
    session_id = content["session_id"]
    thread_id = content["thread_id"]
    messages = content["messages"]
    # Add chat completion api here 
    response = client.chat.completions.create(
        model=my_assistant.model,
        messages=messages,
        response_format={"type":"json_object"}
    )
    
    result["response"] = response
    result["status"] = SUCCESS
    return jsonify(result)

if __name__ == "__main__":
    app.logger.debug("Server is started")
    parser = ArgumentParser()

    # Required arguments
    parser.add_argument("--config_dir", type=str, required=True)
    parser.add_argument("--log_dir", type=str, required=True)
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--proj_name", type=str, required=True)

    # Optional arguments
    parser.add_argument("--replay_dir", type=str, default="../logs")

    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--verbose", action="store_true")

    global args
    args = parser.parse_args()

    # Create a project directory to store logs
    global config_dir, proj_dir
    config_dir = args.config_dir
    proj_dir = os.path.join(args.log_dir, args.proj_name)
    if not os.path.exists(args.log_dir):
        os.mkdir(args.log_dir)
    if not os.path.exists(proj_dir):
        os.mkdir(proj_dir)

    # Create a text file for storing metadata
    global metadata_path
    metadata_path = os.path.join(args.log_dir, "metadata.txt")
    if not os.path.exists(metadata_path):
        with open(metadata_path, "w") as f:
            f.write("")

    global session_id_history
    metadata = dict()
    metadata = update_metadata(metadata, metadata_path)

    global verbose
    verbose = args.verbose

    app.run(
        host="0.0.0.0",
        port=args.port,
        debug=args.debug,
    )
