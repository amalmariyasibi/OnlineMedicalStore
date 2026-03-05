# AI Health Chatbot - Medical NLP Assistant

## Overview
The AI Health Chatbot is an intelligent medical assistant integrated into the Medihaven online medical store. It provides symptom-based medicine suggestions, doctor consultation recommendations, and general health advice.

## Features

### 1. Symptom-Based Medicine Suggestion ✔
- Users can describe their symptoms in natural language
- AI analyzes symptoms and suggests appropriate over-the-counter medicines
- Provides detailed information including:
  - Medicine name and description
  - Recommended dosage
  - Availability status
  - Direct links to purchase from the store

### 2. "Should I Go to a Doctor?" Analysis ✔
- Intelligent triage system that evaluates symptom severity
- Three urgency levels:
  - **High (Red)**: Immediate medical attention required
  - **Moderate (Yellow)**: Schedule doctor appointment within 24-48 hours
  - **Low (Green)**: Can be managed at home with self-care
- Provides clear reasoning for recommendations

### 3. General Health Query Support ✔
- Answers common health questions about:
  - Vitamins and supplements
  - Diet and nutrition
  - Exercise and fitness
  - Sleep and insomnia
  - Stress and anxiety management
  - Medication safety

### 4. Future Enhancement: Prescription Advising Chatbot
- Will analyze uploaded prescriptions
- Provide medication reminders
- Check for drug interactions
- Offer refill suggestions

## Technical Implementation

### Frontend Components

#### HealthChatbot.js (`online_frontend/src/pages/HealthChatbot.js`)
- Main chatbot interface with real-time messaging
- Three chat modes: General, Symptoms, Doctor Advice
- Beautiful UI with message bubbles, loading states, and animations
- Responsive design for mobile and desktop

#### ChatbotButton.js (`online_frontend/src/components/ChatbotButton.js`)
- Floating action button accessible from any page
- Animated pulse effect to draw attention
- Tooltip on hover
- Only visible to logged-in users

### Backend API Routes

#### Chatbot Routes (`online_backend/routes/chatbot.js`)

**POST /api/chatbot/analyze-symptoms**
- Analyzes user symptoms and suggests medicines
- Returns matched symptoms and medicine recommendations
- Flags serious symptoms requiring immediate attention

**POST /api/chatbot/doctor-analysis**
- Evaluates symptom severity
- Provides urgency level and consultation recommendation
- Considers symptom duration and persistence

**POST /api/chatbot/general-query**
- Handles general health questions
- Keyword-based response system
- Provides educational health information

### Symptom Database
The chatbot includes a comprehensive symptom-to-medicine mapping for common conditions:
- Headache, Fever, Cough, Cold
- Sore throat, Stomach ache, Diarrhea
- Nausea, Allergies, Pain
- Acidity, Constipation
- And more...

### Safety Features
- **Serious Symptom Detection**: Automatically identifies life-threatening symptoms
- **Disclaimers**: Every AI response includes a disclaimer to consult healthcare professionals
- **Emergency Alerts**: Red alerts for symptoms requiring immediate medical attention
- **No Diagnosis**: Chatbot provides information only, not medical diagnosis

## User Experience

### Access Points
1. **Navigation Menu**: "AI Health Assistant" link in main navigation
2. **User Dashboard**: Dedicated card with icon and description
3. **Floating Button**: Always-accessible button on bottom-right corner

### Chat Flow
1. User greeted with welcome message and three options
2. User selects chat mode or types directly
3. AI processes input and provides relevant response
4. Medicine suggestions include "View in Store" buttons
5. Doctor recommendations show color-coded urgency levels
6. Users can start new chat anytime with "New Chat" button

### Mobile Responsive
- Optimized for all screen sizes
- Touch-friendly interface
- Scrollable message history
- Fixed input area at bottom

## Integration with Existing Features

### Seamless Integration
- Uses existing authentication system (AuthContext)
- Maintains consistent UI/UX with Tailwind CSS
- Follows existing routing patterns
- No disruption to current functionalities

### Protected Routes
- Chatbot accessible only to logged-in users
- Integrates with ProtectedRoute component
- Respects user roles and permissions

## Installation & Setup

### Dependencies
All required dependencies are already included in the project:
- React Router DOM (routing)
- Axios (API calls)
- Tailwind CSS (styling)

### Backend Setup
1. Chatbot routes automatically loaded in `server.js`
2. No additional database setup required
3. Works with existing Express server

### Frontend Setup
1. Chatbot component imported in `App.js`
2. Route added to routing configuration
3. Floating button added to main layout

## Usage Examples

### Example 1: Symptom Analysis
```
User: "I have a headache and fever"
Bot: Suggests Paracetamol 500mg and Ibuprofen 400mg
     with dosage information and purchase links
```

### Example 2: Doctor Consultation
```
User: "I've had chest pain for 2 hours"
Bot: 🚨 HIGH URGENCY - Visit emergency room immediately
```

### Example 3: General Health
```
User: "What vitamins should I take?"
Bot: Provides information about common vitamins and
     recommends consulting healthcare provider
```

## Security & Privacy

### Data Handling
- User queries logged with user ID for personalization
- No sensitive medical data stored permanently
- HIPAA-compliant disclaimer on all responses

### API Security
- All routes require authentication
- Input validation on all endpoints
- Error handling prevents information leakage

## Future Enhancements

### Phase 2 Features
1. **Prescription Analysis**
   - OCR for prescription images
   - Medication interaction checking
   - Refill reminders

2. **Advanced NLP**
   - Integration with medical NLP APIs
   - Multi-language support
   - Voice input/output

3. **Personalization**
   - Health profile integration
   - Medication history tracking
   - Personalized recommendations

4. **Analytics**
   - Track common symptoms
   - Popular medicine suggestions
   - User satisfaction metrics

## Testing

### Manual Testing Checklist
- ✅ Chatbot loads correctly
- ✅ Welcome message displays
- ✅ Three modes work properly
- ✅ Symptom analysis returns medicines
- ✅ Doctor analysis shows urgency levels
- ✅ General queries get responses
- ✅ Floating button navigates to chatbot
- ✅ Mobile responsive design works
- ✅ New chat button resets conversation

### Test Scenarios
1. Test with common symptoms (headache, fever)
2. Test with serious symptoms (chest pain)
3. Test with vague descriptions
4. Test general health questions
5. Test on mobile devices
6. Test with logged-out users (should not see chatbot)

## Support & Maintenance

### Common Issues
- **Chatbot not loading**: Check backend server is running
- **No medicine suggestions**: Verify symptom keywords in database
- **API errors**: Check network connectivity and CORS settings

### Monitoring
- Monitor API response times
- Track user engagement metrics
- Review chatbot conversation logs for improvements

## Conclusion
The AI Health Chatbot enhances Medihaven's customer experience by providing instant health guidance, medicine recommendations, and triage support. It's designed to be helpful, safe, and user-friendly while maintaining professional medical standards.

---

**Disclaimer**: This chatbot provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with questions regarding medical conditions.
