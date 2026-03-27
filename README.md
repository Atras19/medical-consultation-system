# Medical Consultation System

## Overview
This repository contains a full-stack web application designed to facilitate medical consultations. The system is split into a frontend client and a backend server, providing a complete environment for managing consultation processes.

## Technologies
The project is built using modern web development tools:
* Frontend: React, TypeScript, Vite
* Styling: Tailwind CSS
* Backend: Node.js (located in the `server` directory)

## Project Structure
* src/ - Contains the frontend source code (React components, views, and assets).
* server/ - Contains the backend logic and server configuration.
* package.json - Defines the dependencies and scripts for the frontend application.
* tailwind.config.js / vite.config.ts - Configuration files for styling and the build tool.

## How to run

### Prerequisites
Ensure you have Node.js and npm (or another package manager like yarn/pnpm) installed on your system.

### Installation

1. Clone the repository to your local machine:
git clone https://github.com/Atras19/medical-consultation-system.git

2. Navigate to the project directory:
cd medical-consultation-system

3. Install frontend dependencies:
npm install

4. Install backend dependencies (assuming a separate package.json exists in the server folder):
cd server
npm install
cd ..

### Execution

To run the application locally for development, you will typically need to start both the frontend and backend servers.

1. Start the backend server:
cd server
npm run dev

2. Start the frontend development server (in a new terminal window):
npm run dev

The frontend should now be accessible via your web browser (typically at http://localhost:5173). Check your terminal outputs for exact local addresses and port numbers.
