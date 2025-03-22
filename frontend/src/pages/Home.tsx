import { Link } from 'react-router-dom';
import './Home.css';

interface Project {
  id: string;
  name: string;
}

const Home: React.FC = () => {
  const projects: Project[] = [
    { id: 'project-1', name: 'Employee Management Database' },
    { id: 'project-2', name: 'Permissions & Access Control Schema' },
    { id: 'project-3', name: 'Customer Orders & Payments Schema' },
    { id: 'project-4', name: 'Product & Cart Schema' },
  ];

  return (
    <div className="home-container">
      <h1 className="home-title">Database Schema for User Roles</h1>
      <div className="project-list">
        {projects.map((project) => (
          <Link key={project.id} to={`/${project.id}`} className="project-link">
            {project.name}
          </Link>
        ))}
      </div>
      <Link to="/new-project" className="new-project-button">
        + New Project
      </Link>
    </div>
  );
};

export default Home;
