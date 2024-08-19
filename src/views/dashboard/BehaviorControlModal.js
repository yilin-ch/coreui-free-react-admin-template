import React, { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from '@coreui/react';

const behaviorStates = [
  { name: "Model_Scaling_Not_Implemented", info: "This state logs a message indicating model scaling is not implemented.", next: { default: 1 } },
  { 
    name: "run_nodes", 
    info: "This state checks a condition to decide if nodes should run.", 
    next: { 
      false: 3, // Points to "Check_If_Devices_Are_On"
      true: 2 // Points to "load_nodes"
    } 
  },
  { name: "load_nodes", info: "This state loads nodes from a YAML configuration.", next: { continue: 3, failed: null } },
  { name: "Check_If_Devices_Are_On", info: "This state checks if devices are on.", next: { default: 4 } },
  { name: "turn_on_imus", info: "This state turns on the IMUs.", next: { default: 5 } },
  { name: "don_imus", info: "This state logs a message indicating that IMUs are worn.", next: { default: 6 } },
  { name: "start_parked_nodes", info: "This state starts parked nodes.", next: { default: 7 } },
  { name: "wait_for_nodes_to_be_ready", info: "This state waits until nodes are ready.", next: { default: 8 } },
  { name: "calibrate_jk", info: "This state calibrates the joint kinematics.", next: { default: 9 } },
  { name: "Set_Trial_Filenames_and_Path", info: "This state sets the trial filenames and path.", next: { default: 10 } },
  { name: "Start_Recording_Question_Mark", info: "This state logs a message asking if recording should start.", next: { default: 11 } },
  { name: "Recording_trial", info: "This state manages the recording trial process.", next: { default: 13 } },
  { name: "addone_to_num_reps", info: "This state increments the number of repetitions.", next: { default: 8 } }, // Points to itself or "record_another"
  { name: "record_another", info: "This is an OperatorDecisionState where the user decides whether to record another trial.", next: { yes: 12, no: null } }, // End state
];

const BehaviorControlModal = ({ visible, onClose }) => {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleNextState = () => {
    const currentState = behaviorStates[currentStateIndex];
    const nextIndex = currentState.next[selectedOption] || currentState.next.default;

    if (nextIndex !== null && nextIndex !== undefined) {
      setCurrentStateIndex(nextIndex);
      setSelectedOption(null); // Reset the selected option
    }
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    handleSetupClick(currentState.name);
  };

  const handlePreviousState = () => {
    if (currentStateIndex > 0) {
      setCurrentStateIndex(currentStateIndex - 1);
      setSelectedOption(null); // Reset the selected option
    }
  };

  const handleSetupClick = (message, branchValue = 0) => {
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
  };

  const currentState = behaviorStates[currentStateIndex];
  const hasOptions = currentState.next && Object.keys(currentState.next).length > 1;

  return (
    <CModal alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader onClose={onClose}>
        <CModalTitle>{currentState.name}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>{currentState.info}</p>
      </CModalBody>
      <CModalFooter>
        {hasOptions ? (
          Object.keys(currentState.next).map(option => (
            <CButton 
              key={option} 
              color="primary" 
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </CButton>
          ))
        ) : (
          <CButton color="primary" onClick={() => handleSetupClick(currentState.name)}>
            Setup
          </CButton>
        )}
        <CButton color="secondary" onClick={handlePreviousState} disabled={currentStateIndex === 0}>
          Previous
        </CButton>
        <CButton color="secondary" onClick={handleNextState} disabled={!hasOptions && currentStateIndex === behaviorStates.length - 1}>
          Next
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default BehaviorControlModal;



