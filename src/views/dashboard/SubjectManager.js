import React, { useState, useEffect } from 'react';
import { CButton, CForm, CFormInput, CCard, CCardHeader, CCardBody, CListGroup, CListGroupItem, CFormLabel, CInputGroup, CCol, CRow } from '@coreui/react';
import SessionManager from './SessionManager';

const SubjectManager = ({ projectName, onBack }) => {
  const [subjects, setSubjects] = useState([]);
  const [subjectInfo, setSubjectInfo] = useState({ subject_id: '', weight: '', height: '' });
  const [selectedSubject, setSelectedSubject] = useState(null);  // Track selected subject
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${projectName}/subjects/`)
      .then(response => response.json())
      .then(data => {
        if (data.subjects) {
          setSubjects(data.subjects);
        } else {
          setError("Failed to load subjects.");
        }
      })
      .catch(() => setError("Failed to load subjects."));
  }, [projectName]);

  const handleCreateSubject = () => {
    fetch(`http://localhost:8000/api/projects/${projectName}/subjects/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subjectInfo),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setSubjects([...subjects, subjectInfo.subject_id]);
          setSubjectInfo({ subject_id: '', weight: '', height: '' });
        } else {
          setError(data.error || "Failed to create subject.");
        }
      })
      .catch(() => setError("Failed to create subject."));
  };

  if (selectedSubject) {
    return (
      <SessionManager 
        projectName={projectName} 
        subjectId={selectedSubject} 
        onBack={() => setSelectedSubject(null)} 
      />
    );
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <h4>Subjects in Project: {projectName}</h4>
        <CButton color="secondary" onClick={onBack} style={{ float: 'right' }}>Back to Projects</CButton>
      </CCardHeader>
      <CCardBody>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <h5>Select Existing Subjects</h5>
        {subjects.length === 0 ? (
            <p>No subject available</p>
        ) : (
          <CListGroup>
            {subjects.map((subject) => (
              <CListGroupItem 
                key={subject} 
                onClick={() => setSelectedSubject(subject)}
                style={{ cursor: 'pointer' }} // Change cursor on hover
              >
                {subject}
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
        
        <h5 className="mt-4">Create New Subject</h5>
        <CForm className="mt-3" onSubmit={(e) => e.preventDefault()}>
          <CRow className="mb-3">
            <CCol>
              <CFormLabel htmlFor="id">Subject ID</CFormLabel>
              <CInputGroup>
                <CFormInput
                  type="text"
                  name="subject_id"
                  value={subjectInfo.subject_id}
                  onChange={(e) => setSubjectInfo({ ...subjectInfo, subject_id: e.target.value })}
                  placeholder="Enter Subject ID"
                  className="mb-2"
                />
              </CInputGroup>
            </CCol>
            <CCol>
              <CFormLabel htmlFor="weight">Weight (kg)</CFormLabel>
              <CInputGroup>
                <CFormInput
                  type="number"
                  name="weight"
                  value={subjectInfo.weight}
                  onChange={(e) => setSubjectInfo({ ...subjectInfo, weight: e.target.value })}
                  placeholder="Enter Weight"
                  className="mb-2"
                />
              </CInputGroup>
            </CCol>
            <CCol>
              <CFormLabel htmlFor="height">Height (cm)</CFormLabel>
              <CInputGroup>
                <CFormInput
                  type="number"
                  name="height"
                  value={subjectInfo.height}
                  onChange={(e) => setSubjectInfo({ ...subjectInfo, height: e.target.value })}
                  placeholder="Enter Height"
                  className="mb-2"
                />
              </CInputGroup>
            </CCol>
          </CRow>
          <CButton className="mt-2" color="primary" onClick={handleCreateSubject}>
            Create Subject
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default SubjectManager;
