# Property Interface

Property Interface is a React + TypeScript application designed for managing property data, agencies, and related configurations. It provides a user-friendly interface for managing data services, pipelines, and properties, along with authentication and agency-specific features.

## Features

- **Dashboard**: View activity logs and data feed countdowns.
- **Agencies Management**: Search, view, and edit agency details.
- **Properties Management**: Search, view, and manage property details.
- **Data Services and Pipelines**: Add, edit, and toggle data services and pipelines.
- **Authentication**: Token-based authentication with optional enable/disable.
- **Dark Mode Support**: Fully responsive with light and dark themes.

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **State Management**: React Hooks
- **API Communication**: Axios
- **Routing**: React Router
- **Charts**: MUI X Charts
- **Build Tool**: Vite

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd property-interface
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the values in `.env` as needed.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Preview the production build:
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── interfaces/       # TypeScript interfaces
├── pages/            # Application pages
├── services/         # API service layer
├── index.css         # Global styles
├── main.tsx          # Application entry point
```

## Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the project for production.
- `npm run preview`: Preview the production build.
- `npm run lint`: Run ESLint to check for code issues.

## Environment Variables

- `VITE_REACT_APP_API_URL`: Base URL for the API.
- `VITE_REACT_ENABLE_AUTH`: Enable or disable authentication (`true` or `false`).

## License

This project is licensed under the MIT License.
