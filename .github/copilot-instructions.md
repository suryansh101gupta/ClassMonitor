# Copilot Instructions for ClassMonitor

## Project Overview
- **ClassMonitor** is a full-stack application with a Node.js/Express backend and a (presumed) separate frontend (not present in this repo).
- The backend is organized by feature: `controllers/`, `models/`, and `routes/` for both `teacher` and `user` domains.
- MongoDB is used for data persistence, configured in `config/mongodb.js`.

## Key Directories & Files
- `backend/app.js` and `backend/server.js`: Entrypoints for the backend server. `server.js` likely starts the server, while `app.js` configures middleware and routes.
- `backend/config/mongodb.js`: Sets up the MongoDB connection.
- `backend/controllers/`: Business logic for teachers and users.
- `backend/models/`: Mongoose schemas for teachers and users.
- `backend/routes/`: Express route definitions for teachers and users.

## Patterns & Conventions
- **MVC Structure**: Each domain (teacher, user) has its own model, controller, and route file.
- **Mongoose**: Used for MongoDB object modeling. Models are defined in `models/` and imported in controllers.
- **Express Router**: Each route file exports a router, which is mounted in `app.js`.
- **Config Separation**: Database config is isolated in `config/mongodb.js`.

## Developer Workflows
- **Start Backend**: From `backend/`, run `node server.js` (or `npm start` if defined in `package.json`).
- **Install Dependencies**: Run `npm install` in the `backend/` directory.
- **Debugging**: Use `console.log` in controllers/models. No custom debug tooling is present.
- **Environment Variables**: If used, they are likely loaded in `config/mongodb.js` (check for `process.env`).

## Integration Points
- **MongoDB**: Connection handled in `config/mongodb.js`.
- **Frontend**: Not present in this repo, but backend is structured for RESTful API consumption.

## Examples
- To add a new domain (e.g., `student`):
  1. Create `models/student_model.js`, `controllers/student_controller.js`, `routes/student_routes.js`.
  2. Register the new router in `app.js`.

## Additional Notes
- No test framework or scripts are present by default.
- No custom linting or formatting rules are defined in this repo.
- Update this file if new conventions or workflows are introduced.
