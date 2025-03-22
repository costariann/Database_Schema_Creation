# Database_Schema_Creation

Overview
This project is a full-stack web application that helps users design database schemas through a conversational interface. Users can provide a prompt describing their requirements (e.g., "We need to manage employees in different companies, track their roles, and log their activities"), and the application generates a SQL database schema using the Hugging Face Inference API. The AI then asks for confirmation ("Does this look good?"), allowing users to approve the schema or request modifications. Once approved, the schema is saved to MongoDB, and the user is redirected to a project page to view the schema and continue refining it.

The application consists of:

Frontend: A React application built with Vite, featuring a chat-like interface for user interaction.
Backend: An Express.js server that handles API requests, integrates with the Hugging Face Inference API for schema generation, and stores project data in MongoDB.
Features
Conversational Schema Generation:
Users start by providing a prompt describing their database requirements.
The application generates a SQL schema and displays it as tables in the UI.
The AI asks, "Does this look good?" to confirm the schema.
Users can approve the schema ("Yes") or request changes (e.g., "No, add a salary column to the employees table").
Schema Persistence:
Once the user approves the schema, it’s saved to MongoDB with a unique project ID.
Users are redirected to a project page (/:projectId) to view and refine the schema.
Responsive UI:
The frontend features a chat interface with a wider chat input, a circular black send button with a white icon, sans-serif font, italicized "User" in the welcome message, and a larger welcome message.
The schema is displayed as tables above the chat area, with columns and data types clearly shown.

Limitations
Hugging Face Inference API Access:
The application relies on the Hugging Face Inference API to generate schemas using the mistralai/Mixtral-8x7B-Instruct-v0.1 model.
Due to permissions issues with the account "Costariann," the Inference API cannot be accessed, resulting in a 500 error when generating schemas. A temporary workaround (hardcoding the schema) was implemented for testing purposes.
Docker and CI/CD:
Due to time constraints, Docker containerization and a CI/CD pipeline were not implemented. The application must be run locally by starting the frontend and backend separately.
Error Handling:
Limited error handling in the frontend; backend errors (e.g., Inference API failures) are not gracefully displayed to the user.
Lastly due to not seeing this project early and for that matter having limited time(less than 24 hours) to submit, I had to overlook certain CSS and make sure the funtionality works.
Prerequisites
Before running the application, ensure you have the following installed:

Node.js: Version 18 or higher (includes npm).
MongoDB: Either a local MongoDB instance or a MongoDB Atlas cluster.
Hugging Face API Token (optional for full functionality):
Required to use the Hugging Face Inference API for schema generation.
Note: The current account ("Costariann") lacks permissions to use the Inference API. A hardcoded schema is used as a workaround.
