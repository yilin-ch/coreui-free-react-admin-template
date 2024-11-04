import React, { useState, useEffect } from 'react';
import { CButton, CForm, CFormInput, CCard, CCardHeader, CCardBody, CListGroup, CListGroupItem } from '@coreui/react';

import ROSControlSection from './ROSControlSection';

const DatafileManager = ({ projectName, subjectId, sessionName, onBack }) => {
  const [datafiles, setDatafiles] = useState([]);
  const [newDatafileName, setNewDatafileName] = useState('');
  const [error, setError] = useState('');

  // Fetch datafiles when the component mounts or sessionName changes
  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${projectName}/subjects/${subjectId}/sessions/${sessionName}/datafiles/`)
      .then(response => response.json())
      .then(data => {
        if (data.datafiles) {
          setDatafiles(data.datafiles);
        } else {
          setError("Failed to load datafiles.");
        }
      })
      .catch(() => setError("Failed to load datafiles."));
  }, [projectName, subjectId, sessionName]);

  return (
    <div>
      <CCard className="mb-4">
        <CCardHeader>
          <h4>Datafiles in Session: {sessionName}</h4>
          <CButton color="secondary" onClick={onBack} style={{ float: 'right' }}>Back to Sessions</CButton>
        </CCardHeader>
        <CCardBody>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <h5>Existing Datafiles</h5>
          {/* {datafiles.length === 0 ? (
            <p>No datafile available</p>
          ) : (
            <CListGroup>
              {datafiles.map((datafile) => (
                <CListGroupItem 
                  key={datafile}
                  style={{ cursor: 'pointer' }} // Change cursor on hover
                >
                  {datafile}
                </CListGroupItem>
              ))}
            </CListGroup>
          )} */}
        </CCardBody>
      </CCard>

      <ROSControlSection 
        projectName={projectName} 
        subjectId={subjectId} 
        sessionName={sessionName} 
      />
    </div>
  );
};

export default DatafileManager;
