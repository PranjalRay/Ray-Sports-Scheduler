# Sports Scheduling App

The Sports Scheduling App is a web application designed to manage and schedule sports sessions. It provides a user-friendly interface for users to create, join, and manage sports sessions, as well as view and edit session details. The app also includes authentication and authorization features to ensure secure access to the system.

## Features

- User Registration and Login: Users can create an account and log in to the app.
- Session Creation: Users can create new sports sessions, specifying the date, time, location, and number of players.
- Session Joining: Users can join existing sports sessions if there are available spots.
- Session Management: Users can view and manage the sports sessions they have created or joined.
- Admin Privileges: Admin users have additional privileges to create new sports and manage all sessions.
- User Authentication: The app uses secure authentication mechanisms to protect user accounts.
- Error Handling: The app includes error handling and validation to provide a smooth user experience.

## Technologies Used

>Node.js
>Express.js
>Sequelize
>Passport.js 
>EJS
>bcrypt
>CSRF Protection
>Flash Messages
>Error Handling

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install the dependencies
4. Set up the database
   - Create a PostgreSQL database.
   - Rename the `.env.example` file to `.env` and update the database configuration.
   - Run database migrations
5. Start the server
6. Access the app in your browser at `http://localhost:3000`

## Usage

1. Create an account or log in to an existing account.
2. Explore the available sports sessions on the Sport List page.
3. Join a session by clicking the "Join" button if there are available spots.
4. Create your own sports sessions by navigating to the "Create Sport" page.
5. View and manage your sessions on the "Sport Detail" page.
6. Admin users can access additional features for managing sports and sessions.
7. Log out of your account when you're done.
