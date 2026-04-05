import requests
import json
import datetime

url = "https://script.google.com/macros/s/AKfycbzWpa98yHvCTYfp0aiOrScOgGhXxZ5EXR6v2cSUtTnhEQpj9fzYhyOWlIacKgxA53vGBA/exec"
data = {
    "sheetName": "Sheet3",
    "Name": "TestName",
    "Date": "2024-04-05",
    "Progress": "50%",
    "timestamp": "2024-04-05T12:00:00Z",
    "Vegetables in two meals of the day": "Yes"
}
response = requests.post(url, data=data)
print(response.status_code)
print(response.text)
