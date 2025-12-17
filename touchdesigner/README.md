# TouchDesigner Integration

Scripts for integrating IMAS API with TouchDesigner.

## Usage

1. Create HTTP Request CHOP with URL:
   ```
   http://localhost:7071/api/FunctionApi/telemetry/latest?deviceId=MySimulatedDevice&limit=1
   ```

2. Create JSON Parse DAT connected to HTTP Request CHOP

3. Use `simple_script.py` in Python DAT to access telemetry data

## Example

```python
def onFrameStart(component, op):
    try:
        distance = op('json_parser')['data', 0, 'distance_cm'].val
        op('your_object').par.scalex = distance / 100.0
    except:
        pass
```
