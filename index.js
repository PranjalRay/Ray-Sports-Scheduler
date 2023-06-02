const app = require("./app");
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3689
app.listen(PORT, () => {
  console.log(`Started express server at port ${PORT}`);
});
