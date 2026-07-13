# 🚀 CryptoVault — Full Stack Cryptocurrency Trading Platform

Designed and developed as a **production-oriented Full Stack Cryptocurrency Trading Platform** inspired by modern fintech applications. CryptoVault enables secure cryptocurrency trading, digital wallet management, payment processing, portfolio tracking, AI-powered assistance, and administrative management, all built upon a scalable architecture with secure coding practices.

---

## 🏗️ Tech Stack

### Frontend
- **Frameworks & Libraries:** React 19, Vite, React Router, Context API
- **Styling & UI:** Tailwind CSS, Framer Motion, Responsive Component-Based Architecture
- **Data & Charts:** Axios, Recharts, Lightweight Charts

### Backend
- **Core Engine:** Java 17, Spring Boot 3.2, Maven
- **Security:** Spring Security, JWT (Stateless Authentication), Role-Based Access Control (RBAC)
- **Data & ORM:** Spring Data JPA, Hibernate, MySQL
- **Validation & Utilities:** Jakarta Bean Validation, Java Mail Sender, Lombok

### Integrations
- **Payments:** Razorpay Payment Gateway (& Stripe)
- **Market Data:** CoinGecko API
- **AI Assistant:** Google Gemini AI API

---

## 🔥 Core Features

- **Authentication & Security:** User Registration & Login, JWT Auth, Email Verification, Two-Factor Authentication (2FA), Role-Based Access Control (RBAC).
- **Trading & Market:** Buy & Sell Cryptocurrency, Live Cryptocurrency Prices, Interactive Trading Charts, Watchlist.
- **Wallet & Portfolio:** Wallet Management, Deposit & Withdrawal, Wallet-to-Wallet Transfer, Portfolio Dashboard, Trading & Transaction History.
- **AI Integration:** Integrated Google Gemini AI for real-time crypto assistance and market insights.
- **Admin Panel:** Complete Administrative Dashboard for User, Wallet, and Order Management.

---

## 🔐 Security & Data Integrity

CryptoVault is engineered with production-ready security practices adhering to **OWASP Top 10** recommendations.

- **Backend Security Hardening:** SQL Injection Prevention, Secure Authentication Filters, Protected REST APIs, Token Expiration, Request Sanitization.
- **Comprehensive DTO & Financial Validation:** Strict server-side validation using Jakarta Bean Validation (`@NotBlank`, `@Positive`, etc.) combined with regex and business rule validation for all financial data (Bank details, Wallet IDs, Trading quantities).
- **Transaction Integrity:** Database consistency and race condition prevention ensured via `@Transactional` operations for all trading, wallet transfers, and deposits/withdrawals.
- **Rate Limiting:** Strategic rate limiting implemented on sensitive endpoints (Login, Trading APIs, AI Chatbot) to prevent abuse.
- **Global Exception Handling:** Centralized `@ControllerAdvice` handling for validation, authentication, and financial exceptions with standardized API error responses.

---

## 🚀 Getting Started

Follow the instructions below to get both the backend and frontend running locally.

### 1. Backend Setup

**Prerequisites:** Java 17, MySQL Server, Maven (or included `mvnw` wrapper)

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Configure the database:
   - Default configuration is in `Backend/src/main/resources/application.properties`.
   - Ensure a MySQL instance is running on `localhost:3306` with user `root` and password `admin` (or override via environment variables like `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend will start on **http://localhost:5454**.

### 2. Frontend Setup

**Prerequisites:** Node.js (v18+), npm

1. Navigate to the frontend directory:
   ```bash
   cd f2
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Configuration:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be accessible at **http://localhost:5173**.

---

## 🚀 Skills & Practices Demonstrated

- **FinTech Engineering:** Secure Financial Transactions, Payment Gateway Integration, Cryptocurrency Trading Workflows, Wallet Management.
- **Software Engineering:** Layered Architecture, RESTful API Design, Clean Code Principles, Separation of Concerns, DTO/Repository/Service Patterns.
- **Full Stack Development:** Seamless API Integration, Protected Routing, Responsive Dashboard Development, Scalable System Design.
