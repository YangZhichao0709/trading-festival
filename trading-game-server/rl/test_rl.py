import requests

print(requests.post("http://localhost:8080/api/rl/reset").json())
print(requests.post("http://localhost:8080/api/rl/step", json={
    "ticker": "BANK",
    "side": "buy",
    "qty": 1000
}).json())
