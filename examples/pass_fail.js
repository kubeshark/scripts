// Monitoring: Fail HTTP Status Code is 500, Pass Anything Else

function onItemQueried(data) {
  // Check if it's an HTTP request and the response status is 500
  if (data.protocol.name === "http" && data.response.status === 500)
    return test.fail(data)
  else
    return test.pass(data)
}
