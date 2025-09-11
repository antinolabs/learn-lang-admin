import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import ModuleDetail from './pages/ModuleDetail';
import LessonDetail from './pages/LessonDetail';
import ModulesPage from './pages/Modules';
import NewCourse from './pages/NewCourse';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/courses/new" element={<NewCourse />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/module/:moduleId" element={<ModuleDetail />} />
          <Route path="/lesson/:lessonId" element={<LessonDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
