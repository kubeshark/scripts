// Monitoring: Pass HTTP Traffic, Fail Anything Else

function onItemQueried(data) {
  // Check if it's an HTTP request and the response status is 500
  if (data.protocol.name === "http" && data.response.status === 500)
    return test.pass(data)
  else
    return test.fail(data)
}
