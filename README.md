# Internship Tracker

A React-based application designed to help manage and track internship applications and networking contacts.

## Overview

The Internship Tracker provides a centralized dashboard to monitor the status of job applications and maintain a record of professional outreach efforts. Data is persisted securely using Firebase Firestore. 

### Key Features
*   **Application Tracking**: Log company names, roles applied for, application dates, sources, and current status.
*   **Networking CRM**: Track LinkedIn or email outreach, including contact names, roles, and follow-up status.
*   **Real-time Synchronization**: All records are instantly synchronized and stored in the cloud via Firebase.
*   **Filtering and Searching**: Quickly locate specific applications or filter by status.

## Data Storage and Privacy

This application utilizes **Firebase Firestore** as its database backend. 
*   **Data Ownership**: The data is stored in your personal Google Firebase project (`internship-tracker-66db2`). It is not stored on any third-party servers related to the creation of this app.
*   **Security Note**: Currently, the Firestore database is configured in "Test Mode," which allows open read and write access. For production use or sensitive data, it is strongly recommended to update your Firebase Security Rules located in the Firebase Console.

## Local Development

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm

### Installation

1.  Clone the repository or download the source code.
2.  Navigate to the project directory in your terminal.
3.  Install the dependencies:

    ```bash
    npm install
    ```

### Running the Application

Start the local development server utilizing Vite:

```bash
npm run dev
```

The application will be accessible via a local URL provided in the terminal output (typically `http://localhost:5173`).

## Deployment

This application is built with Vite and is pre-configured for seamless deployment to modern hosting platforms such as Vercel.

To deploy on Vercel:
1.  Push your code to a GitHub repository.
2.  Import the repository into Vercel as a new project.
3.  Vercel will automatically detect the Vite configuration and build the application.
4.  Once deployed, ensure you add your Vercel domain to the "Authorized domains" list within the Firebase Console under Authentication > Settings.

## Technologies Used
*   React
*   Vite
*   Firebase (Firestore)
