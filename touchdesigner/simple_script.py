def onStart(component, op):
    op.current_distance = 0
    op.current_device_id = ""
    print("Script started")

def onFrameStart(component, op):
    try:
        distance = op('json_parser')['data', 0, 'distance_cm'].val
        device_id = op('json_parser')['data', 0, 'deviceId'].val
        
        op.current_distance = distance
        op.current_device_id = device_id
        
    except:
        pass
