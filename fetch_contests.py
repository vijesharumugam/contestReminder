import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

USERNAME = os.getenv('CLIST_USERNAME')
API_KEY = os.getenv('CLIST_API_KEY')

if not USERNAME or not API_KEY:
    print("Error: CLIST_USERNAME or CLIST_API_KEY not found in .env file.")
    exit(1)

BASE_URL = "https://clist.by/api/v2/"

def get_headers():
    return {
        "Authorization": f"ApiKey {USERNAME}:{API_KEY}"
    }

def get_resource_ids(resource_names):
    url = BASE_URL + "resource/"
    params = {
        "name__in": ",".join(resource_names),
        "limit": 10
    }
    try:
        response = requests.get(url, headers=get_headers(), params=params)
    except Exception as e:
        print(f"Exception during resource fetch: {e}")
        return {}
    
    if response.status_code != 200:
        print(f"Error fetching resources: {response.status_code}")
        print(f"Response: {response.text}")
        return {}
    
    try:
        data = response.json()
    except Exception as e:
        print(f"JSON decode error: {e}")
        print(f"Raw response: {response.text}")
        return {}
        
    resource_map = {}
    for resource in data.get('objects', []):
        resource_map[resource['name']] = resource['id']
    return resource_map

def get_contests(resource_ids):
    if not resource_ids:
        print("No resource IDs provided.")
        return
    
    url = BASE_URL + "contest/"
    from datetime import timezone
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    params = {
        "resource_id__in": ",".join(map(str, resource_ids)),
        "start__gt": now,
        "order_by": "start",
        "limit": 10
    }
    
    try:
        response = requests.get(url, headers=get_headers(), params=params)
    except Exception as e:
        print(f"Exception during contest fetch: {e}")
        return

    if response.status_code != 200:
        print(f"Error fetching contests: {response.status_code}")
        print(f"Response: {response.text}")
        return

    try:
        data = response.json()
    except:
        print("Failed to decode contest JSON")
        return

    contests = data.get('objects', [])
    
    if not contests:
        print("No upcoming contests found.")
        return

    print(f"\n{'Contest Name':<50} | {'Start Time (UTC)':<20} | {'Duration':<10} | {'Resource':<15}")
    print("-" * 105)
    
    for contest in contests:
        name = contest.get('event', 'N/A')
        start = contest.get('start', 'N/A')
        duration = contest.get('duration', 'N/A')
        
        resource_val = contest.get('resource', 'N/A')
        if isinstance(resource_val, dict):
            resource = resource_val.get('name', 'N/A')
        else:
            resource = str(resource_val)
        
        try:
            dur_seconds = int(duration)
            hours = dur_seconds // 3600
            mins = (dur_seconds % 3600) // 60
            duration_str = f"{hours}h {mins}m"
        except:
            duration_str = str(duration)

        print(f"{name[:48]:<50} | {start:<20} | {duration_str:<10} | {resource:<15}")

def main():
    target_resources = ['codechef.com', 'leetcode.com', 'codeforces.com']
    resource_ids_map = get_resource_ids(target_resources)
    
    found_ids = []
    for name in target_resources:
        if name in resource_ids_map:
            found_ids.append(resource_ids_map[name])
        else:
            print(f"Warning: Resource ID for '{name}' not found.")
    
    if found_ids:
        get_contests(found_ids)
    else:
        print("No valid resource IDs found.")

if __name__ == "__main__":
    main()
