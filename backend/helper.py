import os 
import json 
import uuid
import collections
from pathlib import Path
from datetime import date, datetime
from time import time, ctime


def get_uuid():
    """Generate Unique ID for a session
    """
    return uuid.uuid4().hex

def print_verbose(title, arg_dict, verbose, force=False):
    if verbose or force:
        print('=' * 40)
        print(title)
        print('=' * 40)
        for key, value in arg_dict.items():
            print(f'{key}: {value}')
            print('-' * 40)
        print('\n')


def print_current_sessions(sessions, message=''):
    if message:
        print(f'\n{message}\n')

    current_timestamp = time()
    print('=' * 40)
    print(f'Most recent sessions ({ctime(current_timestamp)})')
    print('=' * 40)
    for session_id, session in sessions.items():
        start_timestamp = session['start_timestamp']
        elapsed_from_start = current_timestamp - start_timestamp  # Elapsed time in seconds
        elapsed_from_start = round(elapsed_from_start / 60, 2)  # Elapsed time in minutes

        last_query_timestamp = session['last_query_timestamp']
        elapsed_from_last_query = current_timestamp - last_query_timestamp
        elapsed_from_last_query = round(elapsed_from_last_query / 60, 2)

        active = ' * ' if elapsed_from_last_query < 15 else ''

        if elapsed_from_start < 60:
            elapsed_from_start = f'{str(elapsed_from_start)} min'
            elapsed_from_last_query = f'{str(elapsed_from_last_query)} min'
            print(f'{session_id}\t{elapsed_from_start:20}{elapsed_from_last_query:20}{active}')
    print('')


def retrieve_log_paths(all_log_dir):
    log_paths = dict()
    log_mtimes = dict()

    json_paths = list(Path(all_log_dir).rglob("*.json"))
    jsonl_paths = list(Path(all_log_dir).rglob("*.jsonl"))

    # Prioritize jsonl version
    for path in jsonl_paths:
        path = str(path)
        session_id = os.path.splitext(os.path.basename(path))[0]
        mtime = os.path.getmtime(path)

        if session_id in log_mtimes:
            # If multiple, select the most recent version
            if log_mtimes[session_id] < mtime:
                log_paths[session_id] = path
                log_mtimes[session_id] = mtime
        else:
            log_paths[session_id] = path
            log_mtimes[session_id] = mtime

    for path in json_paths:
        path = str(path)
        session_id = os.path.splitext(os.path.basename(path))[0]
        if session_id not in log_paths:
            log_paths[session_id] = path
    return log_paths


def append_session_to_file(session, session_id_history_path):
    try:
        with open(session_id_history_path, 'a') as f:
            json.dump(session, f)
            f.write('\n')
    except Exception as e:
        print('Failed to write access code history')
        print(e)


def save_log_to_json(path, log):
    with open(path, 'w') as f:  # Overwrite existing file
        json.dump(log, f)


def save_log_to_jsonl(path, log):
    with open(path, 'a') as f:  # Append to existing file
        for entry in log:
            json.dump(entry, f)
            f.write('\n')


def compute_stats(log):
    event_names = []
    for event in log:
        event_name = event['eventName']
        if not event_name:
            print(event)
        else:
            event_names.append(event_name)

    event_counter = collections.Counter(event_names)
    stats = {
        'eventCounter': dict(event_counter),
    }
    return stats

