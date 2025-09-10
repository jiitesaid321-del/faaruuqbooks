// 👇 MUST BE FIRST LINE (after imports)
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});
