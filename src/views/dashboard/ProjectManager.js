import React, { useState, useEffect } from 'react';
import { CButton, CForm, CFormInput, CCard, CCardHeader, CCardBody, CListGroup, CListGroupItem, CRow, CCol } from '@coreui/react';
import SubjectManager from './SubjectManager';

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);  // Track selected project
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/projects/')
      .then(response => response.json())
      .then(data => {
        if (data.projects) {
          setProjects(data.projects);
        } else {
          setError("Failed to load projects.");
        }
      })
      .catch(() => setError("Failed to load projects."));
  }, []);

  const handleCreateProject = () => {
    fetch('http://localhost:8000/api/projects/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_name: newProjectName }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setProjects([...projects, newProjectName]);
          setNewProjectName('');
        } else {
          setError(data.error || "Failed to create project.");
        }
      })
      .catch(() => setError("Failed to create project."));
  };

  if (selectedProject) {
    return (
      <SubjectManager projectName={selectedProject} onBack={() => setSelectedProject(null)} />
    );
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <h4>Select Projects</h4>
      </CCardHeader>
      <CCardBody>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <h5>Select Existing Projects</h5>
        {projects.length === 0 ? (
          <p>No project available</p>
        ) : (
          <CListGroup>
            {projects.map((project) => (
              <CListGroupItem
                key={project}
                onClick={() => setSelectedProject(project)}
                style={{ cursor: 'pointer' }} // Change cursor on hover
                className="project-item" // Add class for styling
              >
                {project}
              </CListGroupItem>
            ))}
          </CListGroup>
        )}

        <h5 className="mt-4">Create New Project</h5>
        <CForm className="mt-3" onSubmit={(e) => e.preventDefault()}>
          <CRow className="mb-3">
            <CCol>
              <CFormInput
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter new project name"
              />
            </CCol>
          </CRow>
          <CButton className="mt-2" color="primary" onClick={handleCreateProject}>
            Create Project
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default ProjectManager;
