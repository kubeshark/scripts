// Error Handling

function onItemCaptured(data) {
  try {
    // Invalid KFL query throws an error
    if (kfl.match("htt ??? a : p", data)) {
      console.log(true);
    } else {
      console.log(false);
    }
  } catch (error) {
    // Should print \`Caught an error! Error: 1:5: unexpected token "?"\`
    console.log("Caught an error!", error);
  }
}
