const { createApp } = require("./app");
const config = require("./config/env");

const app = createApp();

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
