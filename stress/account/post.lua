package.path = "../?.lua"
local json = require "json"

wrk.method = "POST"
wrk.body = json.encode({
  query = [[query account {
    core {
      serverInfo {
        host time
      }
      account(cif: "10001") {
        name
      }
    }
  }]]
})
wrk.headers["Content-Type"] = "application/json"

response = function (status, headers, body)
  if status ~= 200 then
    io.write("[response] Body:\n")
    io.write(body)
  end
end
