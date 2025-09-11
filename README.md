# Language Learning Admin Dashboard

A comprehensive admin dashboard for managing language learning courses, modules, lessons, and flashcards. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Course Management**: Create and manage language learning courses
- **Module Generation**: Generate modules for courses using AI
- **Lesson Creation**: Generate lessons for modules with customizable difficulty levels
- **Flashcard Management**: Generate, preview, and approve flashcards for lessons
- **Approval Workflow**: Review and approve generated content before publishing
- **Modern UI**: Clean, responsive design with intuitive navigation

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout with sidebar navigation
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── CourseDetail.tsx # Course management page
│   ├── ModuleDetail.tsx # Module management page
│   └── LessonDetail.tsx # Lesson and flashcard management
├── services/           # API integration
│   └── api.ts         # API service functions
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types and interfaces
└── App.tsx            # Main app component with routing
```

## API Integration

The dashboard integrates with the following APIs:

### Course APIs
- `POST /api/course/{courseId}/generate-modules` - Generate modules for a course
- `GET /api/course/{courseId}` - Get course details
- `GET /api/courses` - List all courses

### Module APIs
- `POST /api/modules/{moduleId}/generate-lessons` - Generate lessons for a module
- `GET /api/lessons/modules/{moduleId}` - Get module details
- `GET /api/courses/{courseId}/modules` - Get modules for a course

### Lesson APIs
- `GET /api/lessons/{lessonId}` - Get lesson details
- `GET /api/modules/{moduleId}/lessons` - Get lessons for a module

### Flashcard APIs
- `POST /api/ai/preview/lesson` - Generate flashcards for a lesson
- `POST /api/ai/approve/lesson` - Approve generated flashcards
- `GET /api/lessons/{lessonId}/flashcards` - Get flashcards for a lesson

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd learn-lang-admin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your API base URL in `.env`:
```bash
# For local development
REACT_APP_API_BASE_URL=http://localhost:3000/api

# For dev tunnel (port forwarding)
REACT_APP_API_BASE_URL=https://gnh3rb7x-3001.inc1.devtunnels.ms/api

# For production
# REACT_APP_API_BASE_URL=https://your-api-domain.com/api
```

5. Start the development server:
```bash
npm start
```

6. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Testing API Connection

To test if your API is accessible, you can run the test script:

```bash
node test-api.js
```

This will verify that your backend API is reachable from the frontend.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Usage

### Course Management
1. Navigate to the Dashboard to view all courses
2. Click on a course to manage its modules
3. Use the "Generate Modules" feature to create modules with AI

### Module Management
1. From a course page, view and manage modules
2. Generate lessons for modules using the "Generate Lessons" feature
3. Set the difficulty level (beginner, intermediate, advanced)

### Lesson and Flashcard Management
1. Navigate to a lesson to manage its flashcards
2. Generate flashcards using the "Generate Flashcards" feature
3. Review and approve/reject individual flashcards
4. Approve all flashcards at once when satisfied

## Configuration

### API Base URL
Update the `REACT_APP_API_BASE_URL` in your `.env` file to point to your backend API:

```bash
# .env file
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

The application will automatically use this environment variable for all API calls.

### Styling
The project uses Tailwind CSS for styling. Customize the theme in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Your custom primary colors
        }
      }
    }
  }
}
```

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

### Code Structure

- **Components**: Reusable UI components in `src/components/`
- **Pages**: Main page components in `src/pages/`
- **Services**: API integration logic in `src/services/`
- **Types**: TypeScript type definitions in `src/types/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
