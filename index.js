require('dotenv').config();
const {GoogleGenAI} = require("@google/genai");
const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
async function askAI(){
    try {
        const response=await ai.models.generateContent({
            model:'gemini-2.5-flash',
            contents:'Explain what a Vector Database is in one sentence.'
        });
        console.log(response.text);
    } catch (error) {
        console.log("Error talking to AI",error);
    }
}
askAI();