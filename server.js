require('dotenv').config()
const express = require('express');
const multer = require('multer');
const PDFParse = require('pdf-parse');
const { Pinecone } = require('@pinecone-database/pinecone');
const cors = require('cors');

const app = express();
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function chunkText(text, maxCharLength = 1000) {
    const chunks = [];
    let currentChunk = "";
    const sentences = text.split(".");
    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxCharLength) {
            chunks.push(currentChunk);
            currentChunk = "";
        }
        currentChunk += sentence + ".";
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    return chunks;
}
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('pdfDocument'), async (req, res) => {
    try {
        const startTime = Date.now();
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }
        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: "Only PDF files are allowed." });
        }
        const pdfData = await PDFParse(req.file.buffer);
        const wordCount = pdfData.text.split(/\s+/).length;
        const chunks = chunkText(pdfData.text);
        const index = pc.index('documind');
        const records = [];
        for (let i = 0; i < chunks.length; i++) {
            const currentText = chunks[i];
            const response = await ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: currentText
            });
            const vectorNumbers = response.embeddings[0].values;
            records.push({
                id: `chunk-${i}`,
                values: vectorNumbers,
                metadata: { text: currentText }
            });
        }
        const fileName = req.file.originalname;
        await index.namespace(fileName).upsert({ records });
        const endTime = Date.now();
        const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
        res.json({
            message: `Successfully saved ${records.length} chunks to Pinecone!`,
            fileName: fileName,
            stats: {
                words: wordCount,
                chunks: records.length,
                time: timeTaken
            }
        });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).send("Server error");
    }
});

app.post('/ask', async (req, res) => {
    try {
        const userQuestion = req.body.question;
        const embedResponse = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: userQuestion
        });
        const fileName = req.body.fileName;
        const questionVector = embedResponse.embeddings[0].values;
        const index = pc.index('documind');
        const searchResults = await index.namespace(fileName).query({
            vector: questionVector,
            topK: 6,
            includeMetadata: true
        });
        if (!req.body.question || !req.body.fileName) {
            return res.status(400).json({ error: "question and fileName are required" });
        }
        const relevantChunks = searchResults.matches.map(match => match.metadata.text);
        const contextText = relevantChunks.join('\n\n');
        const prompt = `
You are a highly intelligent and professional document assistant. 
Your job is to answer the user's question using ONLY the provided CONTEXT.
CRITICAL RULES:
0.Don't write answer in starting at first.
1. ALWAYS use rich Markdown formatting. Use **bold text** to highlight key terms, companies, and metrics. Use bullet points for lists, and use Markdown headers (###) to organize your response.
2. Structure your answer to look like a highly professional, formatted report.
3. If the answer is NOT explicitly written in the provided CONTEXT, you must reply strictly exactly with: "I'm sorry, but I cannot find the answer to that in the uploaded document." and you should not reply with anything else.
4. Do NOT make up information or use outside knowledge.
5.DO NOT use table at all and answer according to given context only and be consise and to the point in answer.
CONTEXT:
${contextText}
QUESTION:
${userQuestion}
        `;
        // const aiResponse = await ai.models.generateContent({
        //     model: 'gemini-2.5-flash',
        //     contents: prompt
        // });
        // res.json({
        //     answer: aiResponse.text
        // })

        const groqResponse = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: userQuestion
                }
            ],
            model: "llama-3.1-8b-instant"
        });

        res.json({
            answer: groqResponse.choices[0].message.content,
            sources: relevantChunks
        });

    } catch (error) {
        console.error("Error asking question:", error);
        res.status(500).send("Server error");
    }
});

app.delete('/document/:fileName', async (req, res) => {
    try {
        const fileName = req.params.fileName;
        const index = pc.index('documind');
        await index.namespace(fileName).deleteAll();
        res.json({ message: `successfully deleted ${fileName} from database` });
    } catch (error) {
        console.error("Error deleting document");
        res.status(500).json({ error: "Failed to delete document from database." });
    }
})


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

});