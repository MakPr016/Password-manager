# PassManager

A modern, secure password manager built with Next.js 15, featuring client-side AES-256 encryption, TOTP-based two-factor authentication, and a privacy-first architecture. Never store your passwords in plaintext again.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb)
![License](https://img.shields.io/badge/license-MIT-blue.svg)


## Overview

PassManager is a full-stack password management application that prioritizes security and user privacy. Built with a zero-knowledge architecture, all sensitive data is encrypted client-side before being sent to the server, ensuring that even the server administrators cannot access your passwords.

### Key Highlights

- **Zero-Knowledge Encryption**: All vault data is encrypted on the client side using AES-256-GCM
- **Two-Factor Authentication**: TOTP-based 2FA for enhanced account security
- **Smart Password Generator**: Generate strong, customizable passwords with exclusion rules
- **Category Organization**: Organize passwords by custom categories
- **Real-time Search**: Debounced search with instant filtering across all fields
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: System-aware theme with manual toggle

## Features

### Core Features

- **User Authentication**
  - Secure email + password authentication with NextAuth.js
  - Persistent sessions with JWT tokens
  - Protected routes with middleware
  
- **Password Generator**
  - Adjustable length (8-128 characters)
  - Customizable character types (uppercase, lowercase, numbers, symbols)
  - Exclude look-alike characters (0, O, l, 1, i, I)
  - One-click copy with auto-clear after 15 seconds

- **Secure Vault**
  - Store passwords with title, username, password, URL, and notes
  - Client-side AES-256-GCM encryption
  - Category-based organization
  - Favorite marking for quick access
  - Real-time debounced search
  - Copy passwords to clipboard with auto-clear

- **Two-Factor Authentication (2FA)**
  - TOTP-based authentication
  - QR code generation for authenticator apps
  - Compatible with Google Authenticator, Authy, Microsoft Authenticator
  - Encrypted 2FA secrets at rest

- **User Settings**
  - Profile management (name, email)
  - Password change functionality
  - Enable/disable 2FA
  - Theme preferences

### Additional Features

- **Search & Filter**: Fast client-side search across title, username, URL, category, and notes
- **Master Password Unlock**: Vault requires master password verification before access
- **Responsive UI**: Modern interface built with shadcn/ui components
- **Auto-logout**: Session expiration after 30 days of inactivity
- **Toast Notifications**: Real-time feedback with Sonner

##  Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15.5** | React framework with App Router and Server Components |
| **React 19** | UI library for building interactive interfaces |
| **TypeScript** | Type-safe JavaScript for better DX |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | High-quality, customizable UI components |
| **Lucide React** | Beautiful icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless backend functions |
| **NextAuth.js** | Authentication and session management |
| **MongoDB** | NoSQL database for user and vault data |
| **Mongoose** | ODM for MongoDB with schema validation |

### Security & Encryption
| Library | Purpose |
|---------|---------|
| **CryptoJS** | Client-side AES-256-GCM encryption |
| **bcryptjs** | Password hashing (12 rounds) |
| **Speakeasy** | TOTP generation for 2FA |
| **QRCode** | QR code generation for 2FA setup |

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control
- **Vercel** - Deployment platform

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** or **pnpm** package manager
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** for version control

### Installation

1. **Clone the repository**
```
git clone https://github.com/MakPr016/passmanager.git
cd passmanager
```

2. **Install dependencies**
```
npm install
or
pnpm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```
Database
MONGODB_URI=mongodb://localhost:27017/passmanager
or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/passmanager

NextAuth Configuration
NEXTAUTH_SECRET=generate_random_string_here
NEXTAUTH_URL=http://localhost:3000

2FA Encryption Key (32 characters)
TWO_FA_SECRET=generate_another_random_string_here
```


4. **Run the development server**
```
npm run dev
or
pnpm dev
```


5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)


## Security Architecture

### Encryption Flow

User Input → Client-Side Encryption → Encrypted Payload → Server Storage  
↓  
User's Master Password  
↓  
PBKDF2 Key Derivation  
↓  
AES-256-GCM Encryption  

### How It Works

1. **Master Password**: User creates a master password during registration
2. **Key Derivation**: Master password is used to derive encryption key using PBKDF2
3. **Client-Side Encryption**: All vault data is encrypted in the browser before transmission
4. **Server Storage**: Server only stores encrypted blobs and metadata
5. **Decryption**: Data is decrypted client-side when user unlocks vault with master password

### What's Encrypted

| Field | Encrypted | Reason |
|-------|-----------|--------|
| Password | ✅ Yes | Contains sensitive credentials |
| Username | ✅ Yes | May reveal personal information |
| URL | ✅ Yes | May contain sensitive paths |
| Notes | ✅ Yes | May contain recovery codes, etc. |
| Title | ❌ No | Required for search functionality |
| Category | ❌ No | Used for filtering |
| Timestamps | ❌ No | Non-sensitive metadata |

### 2FA Implementation

- **TOTP Standard**: Time-based One-Time Password (RFC 6238)
- **Secret Storage**: 2FA secrets are encrypted at rest using AES-256
- **QR Code**: Generated server-side, displayed once during setup
- **Verification**: 6-digit codes verified with 30-second window

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Session Management**: JWT tokens with 30-day expiration
- **Auto-logout**: Inactive sessions automatically expire
- **Clipboard Security**: Auto-clear after 15 seconds