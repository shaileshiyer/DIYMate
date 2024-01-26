import os
import csv
import json
import collections

def update_metadata(metadata, metadata_path):
    """Update metadata with the most recent history."""
    with open(metadata_path, 'r') as f:
        lines = f.read().split('\n')
        for line in lines:
            if not line:  # Skip empty line at the end
                continue
            history = json.loads(line)
            session_id = history['session_id']

            # Overwrite with the most recent history
            metadata[session_id] = history
    return metadata