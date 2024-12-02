// hub.action("hi",{
//   key: utils.nodeName(),
//   value: {
//     a: 1,
//     b: "this is b"
//   }
//   });


var map = {};

function onHubAction(action, object) {
    console.log(action, JSON.stringify(object));
    // Ensure 'key' and 'value' are properly defined
    if (object.key && object.value) {
        // Initialize the array if it doesn't exist for the key
        if (!map[object.key]) {
            map[object.key] = [];
        }
        // Push the value into the array
        map[object.key].push(object.value);
    }
    console.log(JSON.stringify(map));
}
