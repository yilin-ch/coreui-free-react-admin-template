import React, { useState, useEffect } from 'react';
import { CButton, CForm, CFormInput, CCard, CCardHeader, CCardBody, CListGroup, CListGroupItem, CRow, CCol } from '@coreui/react';
import DatafileManager from './DatafileManager';

const SessionManager = ({ projectName, subjectId, onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);  // Track selected session
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${projectName}/subjects/${subjectId}/sessions/`)
      .then(response => response.json())
      .then(data => {
        if (data.sessions) {
          setSessions(data.sessions);
        } else {
          setError("Failed to load sessions.");
        }
      })
      .catch(() => setError("Failed to load sessions."));
  }, [projectName, subjectId]);

  const handleCreateSession = () => {
    fetch(`http://localhost:8000/api/projects/${projectName}/subjects/${subjectId}/sessions/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_name: newSessionName }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setSessions([...sessions, newSessionName]);
          setNewSessionName('');
        } else {
          setError(data.error || "Failed to create session.");
        }
      })
      .catch(() => setError("Failed to create session."));
  };

  if (selectedSession) {
    return (
      <DatafileManager 
        projectName={projectName} 
        subjectId={subjectId} 
        sessionName={selectedSession} 
        onBack={() => setSelectedSession(null)} 
      />
    );
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <h4>Sessions in Subject: {subjectId}</h4>
        <CButton color="secondary" onClick={onBack} style={{ float: 'right' }}>Back to Subjects</CButton>
      </CCardHeader>
      <CCardBody>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <h5>Select Existing Sessions</h5>
        {sessions.length === 0 ? (
          <p>No session available</p>
        ) : (
          <CListGroup>
            {sessions.map((session) => (
              <CListGroupItem 
                key={session} 
                onClick={() => setSelectedSession(session)}
                style={{ cursor: 'pointer' }} // Change cursor on hover
                className="session-item" // Add class for styling
              >
                {session}
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
        
        <h5 className="mt-4">Create New Session</h5>
        <CForm className="mt-3" onSubmit={(e) => e.preventDefault()}>
          <CRow className="mb-3">
            <CCol>
              <CFormInput
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Enter new session name"
              />
            </CCol>
          </CRow>
          <CButton className="mt-2" color="primary" onClick={handleCreateSession}>
            Create Session
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default SessionManager;
