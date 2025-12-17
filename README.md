# MediBot - AI Medical Assistant Chatbot

![LLM](https://img.shields.io/badge/LLM-Gemini%202.5%20Pro-blue)
![Status](https://img.shields.io/badge/Status-Production-success)
![AWS](https://img.shields.io/badge/Cloud-AWS%20Serverless-orange)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blueviolet)

A modern, AI-powered medical assistant chatbot with multimodal capabilities, step-by-step visual guides, and secure health profile management.

## ✨ Features

- 🤖 **Google Gemini 2.5 Pro** for accurate medical advice & reasoning
- 🖼️ **Step-by-Step Visual Guides** - AI generates distinct illustrations for each treatment step
- 📎 **Large File Analysis** - Upload PDFs/Images (up to 50MB) via S3 for AI analysis
- 🔐 **Secure Authentication** - AWS Cognito (Sign up, Sign in, Password Reset)
- 💾 **Persisted History** - Chats are saved to DynamoDB and can be reloaded
- 🏥 **Health Profile** - Stores conditions, medications, and allergies for personalized context
- ⚡ **High Performance** - CloudFront caching + Lambda Function URLs for speed
- 📱 **Responsive Design** - Mobile-first UI built with React & Vanilla CSS

---

## 🚀 Live Demo

**Frontend**: [https://d17eixu2k5iihu.cloudfront.net](https://d17eixu2k5iihu.cloudfront.net)

**Test User**: `moggalogroup@gmail.com` / `Moggalo@69` (or sign up)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS CloudFront                          │
│              https://d17eixu2k5iihu.cloudfront.net         │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌──────────────────┐                   ┌───────────────────┐
│  S3 (Frontend)   │                   │   API Gateway     │
│  Vite/React App  │                   │   REST API        │
└──────────────────┘                   └───────────────────┘
                                                 │
                                                 ▼
                                       ┌───────────────────┐
                                       │  Lambda Function  │
                                       │  FastAPI + Python │
                                       └───────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
          ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
          │   Cognito    │            │   DynamoDB   │            │  Google      │
          │  User Pool   │            │ (Profiles +  │            │  Gemini AI   │
          └──────────────┘            │   History)   │            └──────────────┘
                                      └──────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology |
|:---|:---|
| **Frontend** | React 18, Vite, TypeScript, Vanilla CSS |
| **Backend** | FastAPI, Python 3.11, Mangum, Pydantic |
| **AI/LLM** | Google Gemini 2.5 Pro (Reasoning), Gemini 2.5 Flash (Images) |
| **Auth** | AWS Cognito + Amplify UI |
| **Database** | AWS DynamoDB (Single Table Design concepts) |
| **Storage** | AWS S3 (Reports, Images, Assets) |
| **Hosting** | AWS CloudFront (CDN) + Lambda (Serverless) |
| **IaC** | AWS SAM (Serverless Application Model) |

---

## 📁 Project Structure

```
├── backend/                 # Python FastAPI (Lambda)
│   ├── api_server.py       # Main API endpoints & logic
│   ├── gemini_client.py    # Gemini AI & Image generation
│   ├── auth.py             # Cognito token verification
│   ├── health_profile.py   # RAG for user health data
│   ├── report_analyzer.py  # Multimodal file analysis
│   └── chat_history.py     # DynamoDB operations
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/    # ChatInterface, StepCard, Layout
│   │   ├── pages/         # History, Profile, Upload
│   │   ├── hooks/         # Custom hooks (useChatState)
│   │   ├── api/           # Typed API client
│   │   └── types/         # Shared TypeScript interfaces
│   └── public/            # Static assets
│
├── infrastructure/         # AWS SAM
│   └── template.yaml      # CloudFormation template
│
├── deploy.sh               # Automated deployment script
└── README.md
```

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Python 3.11
- AWS CLI configured
- SAM CLI installed

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api_server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` in the root:
```env
GOOGLE_API_KEY=your_gemini_api_key
```

---

## ☁️ Deployment

We use a unified deployment script that handles:
1. Backend Build (SAM)
2. Stack Deployment (CloudFormation)
3. Frontend Build (Vite)
4. S3 Upload & CloudFront Invalidation

```bash
# Deploy entire stack
export GOOGLE_API_KEY="your_key"
./deploy.sh
```

---

## 🔒 Security

- **HTTPS Everywhere**: TLS 1.3 via CloudFront & API Gateway.
- **Data Encryption**: S3 buckets and DynamoDB tables encrypted at rest (AES-256).
- **Authentication**: JWT validation for all personalized endpoints.
- **Presigned URLs**: Secure, time-limited access for file uploads.

---

## 📄 License

MIT License
