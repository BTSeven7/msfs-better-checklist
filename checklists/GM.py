import os
import json
from datetime import datetime, timezone

def generate_master_json(directory_path='.'):
    master_data = {"aircraft": {}}

    # Loop through all files in the directory
    for file in os.listdir(directory_path):
        if file.endswith("_checkguide.json"):  # Check if the file is a JSON checklist
            # Get file path
            file_path = os.path.join(directory_path, file)
            
            # Open and read the JSON file
            with open(file_path, 'r') as json_file:
                try:
                    data = json.load(json_file)
                    aircraft = data['Header']['aircraft']
                    author = data['Header']['author']

                    # Get file stats
                    stats = os.stat(file_path)
                    last_updated = datetime.fromtimestamp(stats.st_mtime, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
                    file_size = str(stats.st_size)
                    
                    # Organize data by aircraft, then by file
                    if aircraft not in master_data["aircraft"]:
                        master_data["aircraft"][aircraft] = []
                    master_data["aircraft"][aircraft].append({
                        "author": author,
                        "fileName": file,
                        "lastUpdated": last_updated,
                        "fileSize": file_size
                    })
                except json.JSONDecodeError:
                    print(f"Error decoding JSON in file: {file}")
                except KeyError:
                    print(f"Missing expected 'Header' or 'aircraft'/'author' keys in file: {file}")

    # Write the dictionary to a JSON file
    with open('checklist_directory.json', 'w') as json_file:
        json.dump(master_data, json_file, indent=4)

# Run the function in the current directory
generate_master_json()