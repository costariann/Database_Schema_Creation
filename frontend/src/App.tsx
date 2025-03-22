import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from 'react-router-dom';
import Home from './pages/Home';
import Project from './pages/Project';
import NewProject from './pages/NewProject';
import './App.css';

// A custom hook to get the current route and manage the title
const useDynamicTitle = () => {
  const location = useLocation();
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    if (location.pathname === '/') {
      setTitle('Database Schema for User Roles');
    } else if (location.pathname === '/new-project') {
      setTitle('New Project');
    } else if (location.pathname.startsWith('/project-')) {
      setTitle('Employee Management Database');
    } else {
      setTitle('');
    }
  }, [location]);

  return { title, setTitle };
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

const AppContent: React.FC = () => {
  const { title } = useDynamicTitle();
  const [promptSent, setPromptSent] = useState<boolean>(false);

  // A function to be called when a prompt is sent
  const handlePromptSent = () => {
    setPromptSent(true);
  };

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" className="logo">
          <span role="img" aria-label="star">
            ⭐
          </span>{' '}
          KeyMap
        </Link>
        {promptSent && title && <h1 className="header-title">{title}</h1>}
        <div className="header-icons">
          <span className="icon">≡</span>
          <span className="icon">👤</span>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/new-project"
          element={<NewProject onPromptSent={handlePromptSent} />}
        />
        <Route
          path="/:projectId"
          element={<Project onPromptSent={handlePromptSent} />}
        />
      </Routes>
    </div>
  );
};

export default App;
