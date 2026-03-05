# AI Health Chatbot - Quick Start Guide

## 🚀 Getting Started

### For Users

#### Accessing the Chatbot
You can access the AI Health Assistant in three ways:

1. **Navigation Menu**: Click "AI Health Assistant" in the top navigation bar
2. **User Dashboard**: Click the "AI Health Assistant" card on your dashboard
3. **Floating Button**: Click the blue chat icon in the bottom-right corner (available on all pages)

#### Using the Chatbot

**Step 1: Choose Your Mode**
When you open the chatbot, you'll see three options:
- 💊 **Find Medicine for Symptoms** - Get medicine recommendations
- 🏥 **Should I See a Doctor?** - Get consultation advice
- 💬 **General Health Query** - Ask any health question

**Step 2: Describe Your Symptoms or Ask Questions**
Type your message in the text box at the bottom. Examples:
- "I have a headache and fever"
- "I've been coughing for 3 days"
- "What vitamins should I take?"

**Step 3: Review the Response**
The chatbot will provide:
- Medicine suggestions with dosage information
- Doctor consultation recommendations with urgency levels
- General health advice and information

**Step 4: Take Action**
- Click "View in Store" to purchase suggested medicines
- Follow doctor consultation recommendations
- Start a new chat anytime with the "New Chat" button

---

## 🛠️ For Developers

### Running the Application

#### Backend Setup
```bash
cd online_backend
npm install
npm start
```
The backend will run on `http://localhost:4321`

#### Frontend Setup
```bash
cd online_frontend
npm install
npm start
```
The frontend will run on `http://localhost:3000`

### File Structure
```
online_frontend/
├── src/
│   ├── pages/
│   │   └── HealthChatbot.js          # Main chatbot interface
│   ├── components/
│   │   └── ChatbotButton.js          # Floating action button
│   └── App.js                         # Updated with chatbot routes

online_backend/
├── routes/
│   └── chatbot.js                     # Chatbot API endpoints
└── server.js                          # Updated with chatbot routes
```

### API Endpoints

#### 1. Analyze Symptoms
```javascript
POST /api/chatbot/analyze-symptoms
Body: { symptoms: "headache and fever", userId: "user123" }
Response: {
  medicines: [...],
  advice: "...",
  matchedSymptoms: [...],
  requiresDoctor: false
}
```

#### 2. Doctor Analysis
```javascript
POST /api/chatbot/doctor-analysis
Body: { symptoms: "chest pain", userId: "user123" }
Response: {
  recommendation: "consult",
  urgency: "high",
  reason: "..."
}
```

#### 3. General Query
```javascript
POST /api/chatbot/general-query
Body: { query: "what vitamins should I take?", userId: "user123" }
Response: {
  response: "..."
}
```

### Customizing the Chatbot

#### Adding New Symptoms
Edit `online_backend/routes/chatbot.js`:
```javascript
const symptomMedicineDB = {
  'your-symptom': [
    {
      name: 'Medicine Name',
      description: 'Description',
      dosage: 'Dosage info',
      available: true
    }
  ]
};
```

#### Modifying Urgency Levels
Edit the `seriousSymptoms` and `moderateSymptoms` arrays:
```javascript
const seriousSymptoms = [
  'chest pain', 'difficulty breathing', ...
];

const moderateSymptoms = [
  'persistent fever', 'persistent cough', ...
];
```

#### Styling Changes
The chatbot uses Tailwind CSS. Modify classes in `HealthChatbot.js`:
```javascript
// Change header color
className="bg-gradient-to-r from-blue-500 to-blue-600"

// Change message bubble colors
className="bg-blue-500 text-white"  // User messages
className="bg-gray-100 text-gray-800"  // Bot messages
```

### Testing

#### Test Symptom Analysis
```javascript
// Test in browser console or API client
fetch('http://localhost:4321/api/chatbot/analyze-symptoms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symptoms: 'headache and fever',
    userId: 'test-user'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

#### Test Doctor Analysis
```javascript
fetch('http://localhost:4321/api/chatbot/doctor-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symptoms: 'chest pain for 2 hours',
    userId: 'test-user'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Troubleshooting

#### Chatbot Not Loading
1. Check if backend server is running on port 4321
2. Verify proxy setting in `package.json`: `"proxy": "http://localhost:4321"`
3. Check browser console for errors

#### API Errors
1. Verify CORS is enabled in backend
2. Check network tab in browser DevTools
3. Ensure user is authenticated

#### Styling Issues
1. Verify Tailwind CSS is properly configured
2. Check `tailwind.config.js` includes all necessary paths
3. Rebuild the project: `npm run build`

### Deployment

#### Backend Deployment (Vercel)
The chatbot routes are already integrated with the existing Vercel deployment configuration.

#### Frontend Deployment
No additional configuration needed. The chatbot will be included in the production build.

---

## 📝 Notes

### Important Disclaimers
- The chatbot provides general information only
- Not a substitute for professional medical advice
- Always includes disclaimers on AI-generated responses
- Serious symptoms trigger immediate medical attention alerts

### Best Practices
- Keep symptom database updated with common conditions
- Monitor user feedback for improvements
- Regularly review and update urgency classifications
- Test with real user scenarios

### Future Enhancements
- Integration with actual medicine inventory
- Prescription image analysis (OCR)
- Multi-language support
- Voice input/output
- Chat history persistence
- Advanced NLP with external APIs

---

## 🆘 Support

For issues or questions:
1. Check the main README: `AI_HEALTH_CHATBOT_README.md`
2. Review API documentation in `chatbot.js`
3. Test with provided examples
4. Check browser console for errors

---

**Happy Coding! 🎉**
