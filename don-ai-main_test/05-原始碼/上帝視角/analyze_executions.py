import json

def analyze_exec(filepath, label):
    print(f"\n{'='*60}")
    print(f"  {label}: {filepath}")
    print(f"{'='*60}")
    with open(filepath) as f:
        data = json.load(f)
    
    # Top level info
    print(f"Status: {data.get('status')}")
    print(f"Mode: {data.get('mode')}")
    print(f"Started: {data.get('startedAt')}")
    print(f"Stopped: {data.get('stoppedAt')}")
    
    # Check execution data
    exec_data = data.get('data', {})
    result_data = exec_data.get('resultData', {})
    run_data = result_data.get('runData', {})
    
    print(f"\nNodes executed: {list(run_data.keys())}")
    
    # Check each node's output
    for node_name, node_runs in run_data.items():
        print(f"\n--- Node: {node_name} ---")
        for i, run in enumerate(node_runs):
            # Check for errors
            if run.get('error'):
                err = run['error']
                print(f"  ERROR: {err.get('message', str(err)[:200])}")
            
            # Check execution data
            exec_items = run.get('data', {})
            for conn_type, connections in exec_items.items():
                for conn_idx, items in enumerate(connections):
                    for item in items:
                        json_data = item.get('json', {})
                        # Print key fields
                        keys = list(json_data.keys())
                        print(f"  Output keys: {keys[:15]}")
                        
                        # Look for event-related fields
                        for key in ['event_name', 'eventName', 'event', 'events', 'data']:
                            if key in json_data:
                                val = json_data[key]
                                val_str = json.dumps(val, ensure_ascii=False) if not isinstance(val, str) else val
                                if len(val_str) > 500:
                                    val_str = val_str[:500] + '...'
                                print(f"  {key}: {val_str}")
                        
                        # Look for CAPI related
                        for key in json_data:
                            val = str(json_data[key])
                            if 'CompleteRegistration' in val or 'Lead' in val or 'pixel' in val.lower() or 'graph.facebook' in val.lower():
                                if len(val) > 300:
                                    val = val[:300] + '...'
                                print(f"  [FB-related] {key}: {val}")
                        
                        # For webhook node, show body
                        if 'body' in json_data:
                            body = json_data['body']
                            body_str = json.dumps(body, ensure_ascii=False) if not isinstance(body, str) else body
                            if len(body_str) > 500:
                                body_str = body_str[:500] + '...'
                            print(f"  body: {body_str}")
                        
                        # Show type/source if available
                        if 'type' in json_data:
                            print(f"  type: {json_data['type']}")

    # Check error info
    error = result_data.get('error', {})
    if error:
        print(f"\n*** EXECUTION ERROR ***")
        print(f"  Message: {error.get('message', 'N/A')}")
        print(f"  Node: {error.get('node', {}).get('name', 'N/A') if isinstance(error.get('node'), dict) else error.get('node', 'N/A')}")

# Analyze success execution
analyze_exec('/home/ubuntu/exec_success.json', 'SUCCESS Execution #1435')

# Analyze error execution
analyze_exec('/home/ubuntu/exec_error.json', 'ERROR Execution #1425')
