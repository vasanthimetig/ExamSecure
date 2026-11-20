# ExamSecure – Secure Online Examination Management System

## Overview
ExamSecure is a web-based examination management system designed to support secure and organized online examinations. It provides separate portals for administrators (HOD), faculty members, and students.

## Features

- **Role-Based Access:** Separate access for HOD, faculty, and students.
- **Examination Management:** Supports examination-related activities through role-specific portals.
- **QR Code Verification:** Uses QR code-based verification as part of the examination process.
- **Tab-Switch Monitoring:** Monitors tab-switch activity during examinations.
- **File Upload Support:** Uses Multer for handling file uploads.
- **Web-Based Interface:** Provides a frontend for interacting with the examination system.

## Technology Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **File Handling:** Multer
- **Additional Functionality:** QR Code Verification

## Project Structure

```text
ExamSecure/
├── backend/
├── frontend/
├── package.json
├── package-lock.json
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js
- npm
- MongoDB

### Installation

1. Clone the repository:

```bash
git clone https://github.com/vasanthimetig/ExamSecure.git
```

2. Navigate to the project directory:

```bash
cd ExamSecure
```

3. Install the dependencies:

```bash
npm install
```

4. Configure the required environment variables for the backend.

5. Start the frontend and backend using their respective development commands.

## Purpose

The project aims to provide a structured online examination environment with role-based access and examination monitoring features.

## Repository

[GitHub – ExamSecure](https://github.com/vasanthimetig/ExamSecure)
