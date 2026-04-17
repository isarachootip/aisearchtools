const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve Static Frontend Files (For Production Monolith)
app.use(express.static(path.join(__dirname, '../dist')));

// Base PIM and Internet Mock Data (Representing our Vector Store)
const mockProductDatabase = [
    { id: '1', name: 'Sony WH-1000XM5', source: 'PIM', price: '$12,990', specs: { auth: 'Official', bluetooth: 'v5.2', anc: 'Industry Leading', battery: '30 hours' }, imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800' },
    { id: '2', name: 'Logitech MX Master 3S', source: 'PIM', price: '$3,990', specs: { auth: 'Official', bluetooth: 'v5.1', ergonomics: 'High', battery: '70 days' }, imageUrl: 'https://images.unsplash.com/photo-1527814050087-379381547330?w=800' },
    { id: '3', name: 'CyberPunk Neon Z-99', source: 'Amazon', price: '$3,190', specs: { auth: 'Verified', bluetooth: 'v5.3', anc: 'Medium', battery: '25 hours' }, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800' },
    { id: '4', name: 'Generic Gadget OEM', source: 'Shopee', price: '$890', specs: { auth: 'OEM Fake', bluetooth: 'v5.0', anc: 'None', battery: '8 hours' }, imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800' }
];

app.post('/api/v1/search', async (req, res) => {
    try {
        const { imageBase64, activeProvider, searchSources, apiKeys } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ status: 'error', message: 'Missing imageBase64 data in request' });
        }

        console.log(`[POST /api/v1/search] Using Engine: ${activeProvider}`);
        
        let aiExtractedData = null;
        let aiUsed = false;

        // Extract using Gemini API if chosen and Key is provided
        if (activeProvider === 'gemini' && apiKeys?.gemini) {
            try {
                console.log('> Calling Google Gemini Vision API...');
                const genAI = new GoogleGenerativeAI(apiKeys.gemini);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast vision model
                
                // Clean up base64 prefix if exists
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
                
                const prompt = `Look at this product carefully. Identify the electronic gadget. Provide a JSON response EXACTLY matching this format without any markdown wrappers or codeblocks: 
                { "guessed_name": "String", "brand": "String", "keywords": ["keyword1", "keyword2"] }`;
                
                const imageParts = [{
                    inlineData: { data: base64Data, mimeType: "image/jpeg" }
                }];
                
                const result = await model.generateContent([prompt, ...imageParts]);
                const responseText = result.response.text().trim();
                console.log("Raw Gemini Output:", responseText);
                
                // Try connecting raw string into json
                aiExtractedData = JSON.parse(responseText.replace(/`/g, '').replace('json', ''));
                aiUsed = true;
                
            } catch (aiErr) {
                console.error("Gemini AI Processing Failed:", aiErr.message);
                // Fallback gracefully
            }
        }

        // Filtering Logic based on UI Sources Selection
        let finalResults = [];

        if (searchSources?.pim) {
            finalResults = finalResults.concat(mockProductDatabase.filter(p => p.source === 'PIM'));
        }
        if (searchSources?.internet) {
            finalResults = finalResults.concat(mockProductDatabase.filter(p => p.source !== 'PIM'));
        }
        if (!searchSources?.pim && !searchSources?.internet) {
            finalResults = mockProductDatabase;
        }

        // If AI worked, we prioritize / highlight the guessed match
        // For prototype, we just change the generic item names to match AI prediction
        if (aiExtractedData && finalResults.length > 0) {
           finalResults = finalResults.map(p => {
               if(p.source !== 'PIM') {
                   // Rename generic mock internet items to AI guessed value for realism
                   return { ...p, name: `${aiExtractedData.brand || 'AI Found'} ${p.name}` };
               }
               return p;
           });
        }

        return res.json({
            status: 'success',
            ai_intelligence: aiUsed ? 'Powered by Real Gemini Vision' : 'Simulated Match Mode',
            ai_analysis: aiExtractedData || 'No AI keys provided, using fallback simulation',
            totalFound: finalResults.length,
            results: finalResults
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// Catch-all route to serve React App for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 [AI Engine Active] Backend API is running!`);
    console.log(`🔗 Endpoint: http://localhost:${PORT}/api/v1/search`);
    console.log(`=================================`);
});
