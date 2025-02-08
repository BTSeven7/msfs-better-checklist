import os
import json
from datetime import datetime, timezone

def generate_master_json(directory_path='.'):
    # Initialize with checklists array
    master_data = {"checklists": []}

    # Loop through all files in the directory
    for file in os.listdir(directory_path):
        if file.endswith("_checkguide.json"):
            file_path = os.path.join(directory_path, file)
            
            with open(file_path, 'r') as json_file:
                try:
                    data = json.load(json_file)
                    aircraft = data['Header']['aircraft']
                    author = data['Header']['author']

                    stats = os.stat(file_path)
                    last_updated = datetime.fromtimestamp(stats.st_mtime, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
                    file_size = str(stats.st_size)
                    
                    # Add to checklists array
                    master_data["checklists"].append({
                        "aircraft": aircraft,
                        "author": author,
                        "fileName": file,
                        "lastUpdated": last_updated,
                        "fileSize": file_size,
                        "displayName": f"{aircraft} by {author}"
                    })
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Error processing file {file}: {str(e)}")

    # Sort the list alphabetically by aircraft name
    master_data["checklists"].sort(key=lambda x: x["aircraft"])

    # Write the dictionary to a JSON file
    with open('checklist_directory_new.json', 'w') as json_file:
        json.dump(master_data, json_file, indent=4)

if __name__ == "__main__":
    generate_master_json()

