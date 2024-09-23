import React, { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CAlert,
  CBreadcrumb,
  CBreadcrumbItem,
  CTooltip,
  CFormInput,
  CFormLabel,
  CInputGroup,
} from '@coreui/react';

// Example behavior states
const behaviorStates = [
  { name: "Turn on IMUs", _id: "turn_on_imus", info: "Please turn on all IMUs.", next: { default: 1 } },
  { name: "Check if IMUs are on", _id: "check_if_imus_on", info: "Checking if devices are on. Please proceed after IMUs flashing white light.", next: { default: 2 } },
  { name: "don_imus", _id: "don_imus", info: "This state logs a message indicating that IMUs are worn.", next: { default: 3 } },
  { name: "Wait for nodes to be ready", _id: "wait_for_nodes_to_be_ready", info: "This state waits until nodes are ready.", next: { default: 4 } },
  // { name: "Start recording?", _id: "Start_Recording_Question_Mark", info: "This state logs a message asking if recording should start.", next: { default: 5 } },
  // { name: "Record another?", _id: "record_another", info: "This is an OperatorDecisionState where the user decides whether to record another trial.", next: { yes: 4, no: null } }, // End state
];

const BehaviorControlModal = ({ visible, onClose }) => {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false); // Loading spinner for setup action
  const [error, setError] = useState(null); // Error handling state
  const [transitionMessage, setTransitionMessage] = useState(''); // Message for state transitions

  const currentState = behaviorStates[currentStateIndex];
  const hasOptions = currentState.next && Object.keys(currentState.next).length > 1;

  // Mock setup click
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

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    handleSetupClick(currentState._id);
  };

  const handleNextState = () => {
    const nextIndex = currentState.next[selectedOption] || currentState.next.default;
    if (nextIndex !== null && nextIndex !== undefined) {
      setCurrentStateIndex(nextIndex);
      setSelectedOption(null); // Reset the selected option
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index <= currentStateIndex) {
      setCurrentStateIndex(index);
      setSelectedOption(null); // Reset option on navigation
    }
  };

  return (
    <CModal alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader onClose={onClose}>
        <CModalTitle>{currentState.name}</CModalTitle>
      </CModalHeader>

      {/* Breadcrumb navigation */}
      <CBreadcrumb>
        {behaviorStates.map((state, index) => (
          <CBreadcrumbItem
            key={state._id}
            active={index === currentStateIndex}
            onClick={() => handleBreadcrumbClick(index)}
            style={{ cursor: index <= currentStateIndex ? 'pointer' : 'not-allowed', color: index <= currentStateIndex ? 'blue' : 'gray' }}
          >
            {state.name}
          </CBreadcrumbItem>
        ))}
      </CBreadcrumb>

      <CModalBody>
        <p>{currentState.info}</p>
        {(currentState._id == "enter_file_name") ? 
          <CInputGroup>
            <CFormInput
              type="text"
              id="filename"
              name="filename"
              placeholder="Enter Filename"
            />
          </CInputGroup> : null
        }
        
        {/* Display a loading spinner if setup is in progress */}
        {loading && <CSpinner color="primary" />}
        
        {/* Display error message */}
        {error && <CAlert color="danger">{error}</CAlert>}

        {/* Display success transition message */}
        {transitionMessage && <CAlert color="success">{transitionMessage}</CAlert>}

        

      </CModalBody>

      <CModalFooter>
        {/* Handle state with multiple options */}
        {hasOptions ? (
          Object.keys(currentState.next).map((option) => (
            <CButton key={option} color="primary" onClick={() => handleOptionClick(option)}>
              {option}
            </CButton>
          ))
        ) : (
          <CButton color="primary" onClick={() => handleSetupClick(currentState._id)}>
            {loading ? <CSpinner size="sm" /> : "Setup"}
          </CButton>
        )}

        <CButton color="secondary" onClick={handleNextState} disabled={loading || (!hasOptions && currentStateIndex === behaviorStates.length - 1)}>
          Next
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default BehaviorControlModal;



