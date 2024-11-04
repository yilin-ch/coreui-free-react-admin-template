import React, { useState, useEffect, useContext } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CBreadcrumb,
  CBreadcrumbItem,
  CInputGroup,
  CFormInput,
  CFormLabel,
  CForm,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import { WebSocketContext } from './WebSocketProvider'; 

const behaviorStates = [
  {
    name: "ROS-OpenSimRT Control",
    _id: "intro",
    info: "This section allows you to control and set up the ROS-OpenSimRT system, including configurations for the IMU and insole sensors. Use the following steps to initialize, calibrate, and run the system as needed.",
    next: { default: 1 },
  },
  {
    name: "Turn on IMUs",
    _id: "turn_on_imus",
    info: "Please turn on all IMUs.",
    next: { default: 2 },
  },
  {
    name: "Check if IMUs are on",
    _id: "check_if_imus_on",
    info: "Checking if devices are on. Please proceed after IMUs flash white light.",
    next: { default: 3 },
  },
  {
    name: "IMUs Worn",
    _id: "don_imus",
    info: "Please confirm that the IMUs are worn correctly.",
    next: { default: 4 },
  },
  {
    name: "Wait for Nodes",
    _id: "wait_for_nodes_to_be_ready",
    info: "Waiting for all nodes to be ready.",
    next: { default: 5 },
  },
  {
    name: "Set File Name",
    _id: "set_file",
    info: "Please provide the file name and path of the record you want to save. If no file path is provided, the default path `/srv/host_data/tmp` will be used.",
    next: { default: 6 },
  },
  {
    name: "Record Movement",
    _id: "record_movement",
    info: "Record the movement once all systems are ready.",
    next: { default: 7 },
  },
];

const ROSControlSection = ({ projectName, subjectId, sessionName }) => {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transitionMessage, setTransitionMessage] = useState('');

  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [recordVisible, setRecordVisible] = useState(false);
  const [recordDisabled, setRecordDisabled] = useState(false);
  const [stopDisabled, setStopDisabled] = useState(true);
  const [re_recordDisabled, setRe_recordDisabled] = useState(true);

  const { logs } = useContext(WebSocketContext);

  const currentState = behaviorStates[currentStateIndex];

  const handleNextState = () => {
    const nextIndex = currentState.next.default;
    if (nextIndex !== null && nextIndex !== undefined) {
      setCurrentStateIndex(nextIndex);
    }
  };

  const handlePreviousState = () => {
    if (currentStateIndex > 0) {
      setCurrentStateIndex(currentStateIndex - 1);
    }
  };

  const handleSetupClick = async (message, branchValue = 0) => {
    const topic = '/flexbe/command/transition';
    fetch('http://localhost:8000/publish/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, message, branchValue }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    setLoading(true);
    setError(null); // Reset error state
    try {
      // Simulate async behavior
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setTransitionMessage('Transition successful!'); // Show success message
      setTimeout(() => setTransitionMessage(''), 2000); // Clear message after 2 seconds
    } catch (error) {
      setLoading(false);
      setError('Failed to execute setup. Please try again.');
    }
  };

  const handleSetNameAndPath = async () => {
    if (!fileName) {
      alert('Please provide a filename');
      return;
    }

    const finalPath = `/srv/host_data/Projects/${projectName}/${subjectId}/${sessionName}/${fileName}`;
    const relativePath = `${projectName}/${subjectId}/${sessionName}/${fileName}`;

    try {
      const response = await fetch('http://localhost:8000/set_name_and_path/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: fileName, filepath: finalPath, relativePath: relativePath }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('ROS Service Response:', data);
        alert('ROS service called successfully!');
      } else {
        alert('Failed to call ROS service');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Breadcrumb click handler to navigate between steps
  const handleBreadcrumbClick = (index) => {
    if (index <= currentStateIndex) {
      setCurrentStateIndex(index);
    }
  };

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <h4>ROS-OpenSimRT Control</h4>
      </CCardHeader>
      <CCardBody>
        {/* Breadcrumb Navigation */}
        <CBreadcrumb className="mt-4">
          {behaviorStates.map((state, index) => (
            <CBreadcrumbItem
              key={state._id}
              active={index === currentStateIndex}
              onClick={() => handleBreadcrumbClick(index)}
              style={{
                cursor: index <= currentStateIndex ? 'pointer' : 'not-allowed',
                color: index <= currentStateIndex ? 'blue' : 'gray',
              }}
            >
              {state.name}
            </CBreadcrumbItem>
          ))}
        </CBreadcrumb>

        <p>{currentState.info}</p>

        {loading && <CSpinner color="primary" />}
        {error && <CAlert color="danger">{error}</CAlert>}
        {transitionMessage && <CAlert color="success">{transitionMessage}</CAlert>}

        {/* File Name and Path Step */}
        {currentState._id === "set_file" && (
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel htmlFor="fileName">File Name</CFormLabel>
                <CInputGroup>
                  <CFormInput
                    type="text"
                    id="fileName"
                    name="fileName"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter file name"
                  />
                </CInputGroup>
              </CCol>
              <CCol>
                <CButton color="primary" onClick={handleSetNameAndPath} style={{ marginTop: '30px' }}>
                  Submit
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        )}

        {/* Record Movement Step */}
        {currentState._id === "record_movement" && (
          <div style={{ marginTop: '10px' }}>
            <CButton
              color="primary"
              className="me-2"
              onClick={() => setRecordVisible(true)}
              disabled={recordDisabled}
            >
              Start Recording
            </CButton>
            <CButton
              color="primary"
              className="me-2"
              onClick={() => {
                handleSetupClick("stop_recording_question_mark");
                setRe_recordDisabled(false);
                setStopDisabled(true);
              }}
              disabled={stopDisabled}
            >
              Stop
            </CButton>
            <CButton
              color="primary"
              className="me-2"
              onClick={() => {
                handleSetupClick("record_another", 0);
                setRe_recordDisabled(true);
                setRecordDisabled(false);
                setCurrentStateIndex(5); // Jump back to "Set File Name and Path" step
              }}
              disabled={re_recordDisabled}
            >
              Record Another
            </CButton>
            <CModal alignment="center" visible={recordVisible} onClose={() => setRecordVisible(false)}>
              <CModalHeader onClose={() => setRecordVisible(false)}>
                Start Recording
              </CModalHeader>
              <CModalBody>
                <p>Please make sure you have done all the setup before recording.</p>
              </CModalBody>
              <CModalFooter>
                <CButton
                  color="secondary"
                  onClick={() => {
                    handleSetupClick("Start_Recording_Question_Mark");
                    setStopDisabled(false);
                    setRecordDisabled(true);
                  }}
                >
                  Start
                </CButton>
              </CModalFooter>
            </CModal>
          </div>
        )}

        <div className="logs-section mb-3">
          <h5>Behavior Logs</h5>
          <CCard>
            <CCardBody style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f3f4f7'}}>
              {logs && logs.length === 0 ? (
                <p>No logs available yet...</p>
              ) : (
                logs.map((log, index) => (
               <p key={index}>{log}</p>
                ))
              )}
            </CCardBody>
          </CCard>
        </div>


        <div className="mt-4 d-flex justify-content-between">
          {/* "Previous" button */}
          <CButton
            color="secondary"
            onClick={handlePreviousState}
            disabled={currentStateIndex === 0 || loading}
          >
            Previous
          </CButton>

          {/* "Setup" button */}
          {currentState._id !== "intro" && currentState._id !== "set_file" && currentState._id !== "record_movement" && (
            <CButton color="primary" onClick={() => handleSetupClick(currentState._id)}>
              {loading ? <CSpinner size="sm" /> : "Execute"}
            </CButton>
          )}

          {/* "Next" button */}
          <CButton
            color="secondary"
            onClick={handleNextState}
            disabled={currentStateIndex === behaviorStates.length - 1 || loading}
          >
            Next
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ROSControlSection;
