const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const { GoogleGenerativeAI } = require("@google/generative-ai");

(async () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // This is on your list and is extremely fast
  });

  const result = await model.generateContent("Say hello");
  console.log(result.response.text());
})();
