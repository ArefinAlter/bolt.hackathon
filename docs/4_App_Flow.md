# App Flow: Dokani Platform (Hackathon Demo)

## 1. Overview
This document outlines the primary user flows for the Dokani platform, designed as a proof-of-concept demo that allows users to experience both business and customer perspectives with a single login. **This is a simulation-focused demo for hackathon purposes.**

---

## Flow 1: Landing Page & Initial Access

**Persona**: Prospective User (Business Owner or Customer)
**Goal**: To discover the platform and access the demo

1. **Landing Page**: User arrives at the main landing page featuring:
   - Modern SaaS landing page components (hero section, features, pricing, etc.)
   - Prominent "Try a Demo of Our Product" button in the hero section
   - Standard marketing content explaining the return/refund automation platform

2. **Demo Access**: User clicks the "Try a Demo" button and is redirected to the login/signup page

---

## Flow 2: Authentication & Role Selection

**Persona**: Demo User
**Goal**: To create an account and choose how to experience the platform

1. **Login/Signup Page**: User can either:
   - Sign up with email/password for a new demo account
   - Log in with existing credentials

2. **Role Selection**: After successful authentication, user is presented with two options:
   - **"Try out our Product as a Business"** - Access business dashboard and tools
   - **"Try out our Product as a Customer"** - Access customer chat interface

3. **Single Profile Access**: Both options use the same user profile, allowing seamless switching between roles

---

## Flow 3: Business Experience

**Persona**: Business Owner (Demo User)
**Goal**: To explore business dashboard, policy management, and persona builder

### 3.1 Business Dashboard
1. **Dashboard Overview**: User sees a comprehensive business dashboard with:
   - Return request monitoring
   - Policy management interface
   - Analytics and insights
   - Support persona builder access
   - Risk assessment tools
   - File management system

2. **Policy Management**: User can:
   - View existing demo policies
   - Create new policy versions
   - Configure return rules and thresholds
   - Activate/deactivate policies
   - Test policies in simulation mode
   - View policy performance analytics
   - Rollback to previous policy versions
   - A/B test different policy configurations

3. **Advanced Analytics Dashboard**: User can access:
   - Return trends and patterns visualization
   - AI decision accuracy rates
   - Customer satisfaction metrics
   - Policy effectiveness analysis
   - Business performance insights
   - Real-time metrics and KPIs
   - Custom date range filtering
   - Export analytics data

4. **Risk Assessment Interface**: User can:
   - View customer risk scoring
   - Monitor fraud detection alerts
   - Analyze risk factors
   - Review risk mitigation recommendations
   - Set risk thresholds
   - View risk assessment history

### 3.2 Support Persona Builder
1. **Voice Persona Creation (ElevenLabs)**:
   - Upload voice samples
   - Configure voice characteristics
   - Test voice generation
   - Save voice personas for use in customer interactions
   - Preview voice in real-time

2. **Video Persona Creation (Tavus)**:
   - Upload video samples of themselves
   - Configure avatar settings
   - Test video avatar generation
   - Save video personas for customer interactions
   - Preview video avatar in real-time

3. **Persona Management**:
   - View all created personas
   - Edit existing personas
   - Set default personas for different scenarios
   - Test personas in preview mode
   - Organize personas by category

### 3.3 Return Request Management
1. **Request Monitoring**: View all return requests with:
   - Real-time status updates
   - Customer information
   - AI recommendations
   - Evidence files
   - Risk scores
   - Policy compliance status

2. **Manual Review**: For requests flagged for human review:
   - Review AI recommendations and confidence scores
   - View customer chat history and evidence
   - Make approve/deny decisions
   - Add internal notes
   - Escalate cases if needed

3. **Return Lifecycle Management**:
   - Create new return requests
   - Track request status through all stages
   - Manage escalations
   - View complete request history
   - Update request status manually

### 3.4 File Management System
1. **Evidence Management**:
   - Upload and organize evidence files
   - Tag and categorize files
   - Set file access permissions
   - View file usage analytics
   - Manage file storage

2. **Asset Library**:
   - Voice sample library
   - Video sample library
   - Template files
   - Brand assets
   - Organized file structure

### 3.5 Testing & Simulation Tools
1. **AI Agent Testing**:
   - Test AI agents with different scenarios
   - Benchmark AI performance
   - Compare different AI configurations
   - View test results and analytics

2. **Persona Testing**:
   - Test voice personas
   - Test video personas
   - Preview personas in different contexts
   - Performance testing

3. **Policy Simulation**:
   - Test policies with sample data
   - Simulate different scenarios
   - View policy impact analysis
   - A/B test policy configurations

### 3.6 Advanced Call Management
1. **Call History**:
   - View all call sessions
   - Access call recordings
   - Review call transcripts
   - Call quality metrics

2. **Call Analytics**:
   - Call duration analysis
   - Call success rates
   - Voice quality metrics
   - Customer satisfaction scores

3. **Call Monitoring**:
   - Real-time call monitoring
   - Live call quality indicators
   - Call performance alerts
   - Voice input processing status

---

## Flow 4: Customer Experience

**Persona**: Customer (Demo User)
**Goal**: To experience the AI-powered return process through chat, voice, and video

### 4.1 Chat Interface
1. **Chat Initiation**: User enters the customer chat interface where they can:
   - Start a new conversation
   - View chat history
   - Access help and support

2. **AI Interaction**: The AI agent:
   - Greets the customer warmly
   - Asks about their return request
   - Guides them through the process
   - Automatically detects return-related conversations

3. **Return Request Process**:
   - Customer mentions their order (e.g., "I want to return ORDER-12345")
   - AI automatically looks up the order
   - AI creates a return request
   - AI guides customer through evidence upload
   - AI provides real-time status updates

4. **Real-time Streaming Features**:
   - Live AI response streaming
   - Real-time typing indicators
   - Live status updates
   - Streaming quality controls

### 4.2 Voice Calling
1. **Voice Call Initiation**: Customer can:
   - Click "Voice Call" button in chat
   - Be connected to AI agent using ElevenLabs voice
   - Experience natural voice conversation

2. **Voice Interaction**:
   - AI agent speaks using configured voice persona
   - Customer can speak naturally
   - AI transcribes and processes speech
   - AI responds with appropriate voice

3. **Voice Features**:
   - Real-time transcription
   - Natural conversation flow
   - Voice emotion and tone matching
   - Call recording and analytics
   - Voice quality monitoring

### 4.3 Video Calling
1. **Video Call Initiation**: Customer can:
   - Click "Video Call" button in chat
   - Be connected to AI agent using Tavus video avatar
   - Experience face-to-face video conversation

2. **Video Interaction**:
   - AI agent appears as configured video avatar
   - Customer sees realistic video representation
   - AI responds with appropriate facial expressions
   - Natural video conversation flow

3. **Video Features**:
   - Realistic avatar appearance
   - Facial expression matching
   - Lip-sync with speech
   - Video recording and analytics
   - Video quality monitoring

### 4.4 Return Request Completion
1. **AI Decision Making**: The system:
   - Evaluates return request against business policies
   - Calculates risk scores
   - Makes automated decisions (approve/deny/review)
   - Provides instant feedback to customer

2. **Customer Notification**: Customer receives:
   - Immediate decision notification
   - Clear explanation of decision
   - Next steps and timeline
   - Access to return portal if needed

3. **Simulated Refund Processing**: For approved returns:
   - System simulates refund processing workflow
   - Customer receives confirmation of simulated refund
   - No actual payment processing occurs (demo only)

---

## Flow 5: User Settings & Preferences

**Persona**: Demo User
**Goal**: To configure personal preferences and settings

1. **User Preferences Page**: User can configure:
   - Language preferences
   - Auto-escalation settings
   - Video/voice call preferences
   - Notification settings
   - Default persona selection
   - Theme preferences
   - Accessibility settings

2. **Profile Management**:
   - Update personal information
   - Change password
   - Manage account settings
   - View account activity

---

## Flow 6: Role Switching

**Persona**: Demo User
**Goal**: To seamlessly switch between business and customer experiences

1. **Navigation**: User can:
   - Access a "Switch Role" option from any page
   - Return to the role selection screen
   - Choose the other role without re-authentication

2. **Data Persistence**: All data persists across role switches:
   - Business policies remain configured
   - Chat history is preserved
   - Persona settings are maintained
   - Return requests continue processing
   - User preferences are maintained

3. **Seamless Experience**: User can:
   - Configure policies as business owner
   - Switch to customer role to test the experience
   - Switch back to business role to see results
   - Iterate and refine the setup

---

## Flow 7: Demo Data & Testing

**Persona**: Demo User
**Goal**: To test the platform with realistic data

1. **Mock Orders**: System provides:
   - Sample orders (ORDER-12345, ORDER-12346, etc.)
   - Realistic product data
   - Various order scenarios for testing

2. **Test Scenarios**: Users can test:
   - Low-value auto-approval returns
   - High-value manual review cases
   - Policy violation denials
   - Complex edge cases
   - Risk assessment scenarios
   - Different persona configurations

3. **Real-time Testing**: Users can:
   - Create policies and immediately test them
   - See AI decisions in real-time
   - Experience the full customer journey
   - Monitor business dashboard updates
   - Test real-time streaming features

---

## Technical Implementation Notes

### Authentication & Authorization
- Single Supabase user account for demo purposes
- Role-based access control handled at frontend level
- Business and customer data linked to same user profile
- Seamless switching between interfaces

### Data Management
- Demo data pre-populated for testing
- Real-time updates across all interfaces
- Persistent session management
- Cross-role data sharing

### AI Integration
- OpenAI GPT-4 for intelligent decision making
- ElevenLabs for voice generation and conversation
- Tavus for video avatar creation and interaction
- Real-time policy evaluation and risk assessment

### Real-time Features
- WebSocket connections for live updates
- Server-Sent Events for streaming responses
- Real-time analytics and monitoring
- Live collaboration features

### Provider Integration Status
- **ElevenLabs**: Active integration for voice generation
- **Tavus**: Active integration for video avatar creation
- **OpenAI**: Active integration for chat and decision making
- **Mock Data**: Active for comprehensive testing 