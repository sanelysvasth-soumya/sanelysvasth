import requests

url = "https://script.google.com/macros/s/AKfycbzWpa98yHvCTYfp0aiOrScOgGhXxZ5EXR6v2cSUtTnhEQpj9fzYhyOWlIacKgxA53vGBA/exec"
data = {
    "sheetName": "Sheet3",
    "Name": "VAL_NAME",
    "Date": "VAL_DATE",
    "Progress": "VAL_PROGRESS",
    "timestamp": "VAL_TIMESTAMP",
    "Vegetables in two meals of the day": "VAL_VEG",
    "20 mins Sunlight (Between 9 AM and 2 PM)": "VAL_SUN"
}
response = requests.post(url, data=data)
print(response.status_code, response.text)
