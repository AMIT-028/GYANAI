const express=require("express");
const dotenv=require("dotenv");
const cors=require("cors");
const chatroutes=require("./routes/chat.js")
const mongoose=require("mongoose")
const authRoutes=require("./routes/authRoutes.js");
const uploadRoutes = require("./routes/uploadRoutes");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api",chatroutes);
app.use("/api/auth", authRoutes);
app.use("/api/files", uploadRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 8080;
const connectdb= async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDB connected")

    }catch(err){
        console.log(err)
    }
}
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  connectdb();
});


// Route to fetch random joke
// app.post("/test", async (req, res) => {
//     const apiKey = process.env.GEMINI_API_KEY;
//     const modelName = "gemini-2.5-flash-preview-05-20"; // Our recommended model for fast text generation
//     const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

//     const options = {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             contents: [{
//                 role: "user",
//                 parts: [{
//                     text: req.body.message
//                 }]
//             }]
//         })
//     };

//     try {
//         const response = await fetch(apiUrl, options);
//         const data = await response.json();

//         // Check if the API returned an explicit error object
//         if (data.error) {
//             console.error("Gemini API Error:", data.error.message);
//             return res.status(data.error.code || 500).send({ error: data.error.message });
//         }

//         // Extract the generated text from the Gemini response structure
//         res.send(data.candidates[0].content.parts[0].text);
//     } catch(err) {
//         console.log(err);
//         res.status(500).send("An error occurred during the API request.");
//     }
// });

