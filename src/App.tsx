import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import ModuleDetail from './pages/ModuleDetail';
import LessonDetail from './pages/LessonDetail';
import ModulesPage from './pages/Modules';
import NewCourse from './pages/NewCourse';
import LoginForm from './components/LoginForm';


import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  return (

    // <Router>
    //   <Routes>

    //     <Route path="/login" element={<LoginForm />} />

    //     {/* Private Routes - With Layout */}

    //     <Route path="/" element={<Layout><Dashboard /></Layout>} />
    //     <Route path="/modules" element={<Layout><ModulesPage /></Layout>} />
    //     <Route path="/courses/new" element={<Layout><NewCourse /></Layout>} />
    //     <Route path="/course/:courseId" element={<Layout><CourseDetail /></Layout>} />
    //     <Route path="/module/:moduleId" element={<Layout><ModuleDetail /></Layout>} />
    //     <Route path="/lesson/:lessonId" element={<Layout><LessonDetail /></Layout>} />

    //   </Routes>
    // </Router>

    <Router>
      <Routes>
        <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginForm />} />
        <Route path="/modules" element={user ? <Layout><ModulesPage /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/courses/new" element={user ? <Layout><NewCourse /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/course/:courseId" element={user ? <Layout><CourseDetail /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/module/:moduleId" element={user ? <Layout><ModuleDetail /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/lesson/:lessonId" element={user ? <Layout><LessonDetail /></Layout> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
