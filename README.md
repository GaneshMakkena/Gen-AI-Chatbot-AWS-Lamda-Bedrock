# MediBot - AI Medical Assistant Chatbot

![LLM](https://img.shields.io/badge/LLM-Gemini%202.5%20Pro-blue)
![Status](https://img.shields.io/badge/Status-Production-success)
![AWS](https://img.shields.io/badge/Cloud-AWS%20Serverless-orange)

A modern, AI-powered medical assistant chatbot with multimodal capabilities.

## ✨ Features

- 🤖 **Google Gemini 2.5 Pro** for accurate medical advice
- 🖼️ **AI-generated illustrations** for every treatment step
- 📎 **File attachments** (PDFs, images) - ChatGPT-style analysis
- 🔐 **User authentication** with AWS Cognito
- 💾 **Chat history** persistence (DynamoDB)
- 🏥 **Health profile** with personalized context
- 🎤 **Voice input** support (Chrome/Edge)
- 🌐 **Multilingual** (English, Telugu, Hindi)
- 📱 **Responsive design** (mobile, tablet, desktop)

---

## 🚀 Live Demo

**Frontend**: [https://d17eixu2k5iihu.cloudfront.net](https://d17eixu2k5iihu.cloudfront.net)

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
│  Next.js Static  │                   │   REST API        │
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
| **Frontend** | Next.js 15, React, TailwindCSS |
| **Backend** | FastAPI, Python 3.11, Mangum |
| **AI/LLM** | Google Gemini 2.5 Pro |
| **Image Gen** | Gemini 2.5 Flash |
| **Auth** | AWS Cognito |
| **Database** | AWS DynamoDB |
| **Storage** | AWS S3 (encrypted) |
| **Hosting** | AWS CloudFront + Lambda |
| **IaC** | AWS SAM |

---

## 📁 Project Structure

```
├── backend/                 # Python FastAPI (Lambda)
│   ├── api_server.py       # Main API endpoints
│   ├── gemini_client.py    # Gemini AI integration
│   ├── auth.py             # Cognito authentication
│   ├── health_profile.py   # User health data
│   └── chat_history.py     # Chat persistence
│
├── frontend/               # Next.js React
│   ├── app/               # Pages (login, signup, profile)
│   ├── components/        # Reusable components
│   └── contexts/          # Auth context
│
├── infrastructure/         # AWS SAM
│   └── template.yaml      # CloudFormation template
│
└── README.md
```

---

## 💻 Local Development

### Backend
```bash
cd backend
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
Create `.env`:
```env
GOOGLE_API_KEY=your_gemini_api_key
```

---

## ☁️ Deployment

```bash
cd infrastructure
sam build
sam deploy --guided \
  --parameter-overrides "GoogleApiKey=YOUR_KEY"
```

---

## 🔒 Security

- ✅ HTTPS everywhere (CloudFront + API Gateway)
- ✅ S3 buckets encrypted at rest (AES-256)
- ✅ JWT authentication (Cognito)
- ✅ DynamoDB encryption (AWS-managed keys)

---

## 📄 License

MIT License
