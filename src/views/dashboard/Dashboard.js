import React, { useEffect, useRef, useState } from 'react';
import { Engine, Scene } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';

import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CButton,
  CButtonGroup,
  CRow,
  CTooltip,
} from '@coreui/react';
import { cilResizeWidth } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import DataChart from './MainCharts';
import BehaviorControlModal from './BehaviorControlModal';  // Import the new component

const getRandomText = () => {
  const texts = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Pellentesque ac felis tellus.",
    "Mauris efficitur nulla ut elit varius sagittis.",
    "Suspendisse potenti.",
    "Praesent venenatis metus at tortor pulvinar varius.",
  ];
  return texts[Math.floor(Math.random() * texts.length)];
};

const Dashboard = () => {
  const [selectedCharts, setSelectedCharts] = useState(['PelvisTX']);
  const [fullWidth, setFullWidth] = useState(false); // State to manage chart layout
  const [currentSection, setCurrentSection] = useState(0); // State to manage current section
  const [responseMessage, setResponseMessage] = useState(''); // State to hold response message
  const [branch, setBranch] = useState(0); // State to hold branch value
  const [visible, setVisible] = useState(false);  // Modal visibility state
  const reactCanvas = useRef(null);

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(reactCanvas.current, true);
      const scene = new Scene(engine);

      const camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 2.5,
        3,
        new Vector3(0, 1, 0),
        scene
      );
      camera.attachControl(reactCanvas.current, true);

      const light = new HemisphericLight('light', new Vector3(1, 1, 0), scene);
      light.intensity = 0.7;

      const box = MeshBuilder.CreateBox('box', { size: 1 }, scene);
      const boxMaterial = new StandardMaterial('boxMaterial', scene);
      boxMaterial.diffuseColor = new Color3(0, 1, 0);
      box.material = boxMaterial;

      engine.runRenderLoop(() => {
        scene.render();
        box.rotation.y += 0.01;
      });

      const resize = () => {
        scene.getEngine().resize();
      };

      window.addEventListener('resize', resize);

      return () => {
        window.removeEventListener('resize', resize);
        engine.dispose();
      };
    }
  }, []);

  const handleChartToggle = (chartType) => {
    setSelectedCharts(prevSelectedCharts =>
      prevSelectedCharts.includes(chartType)
        ? prevSelectedCharts.filter(chart => chart !== chartType)
        : [...prevSelectedCharts, chartType]
    );
  };

  const toggleFullWidth = () => {
    setFullWidth(!fullWidth);
  };

  const handleButtonClick = (message, branchValue = 0) => {
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
        setResponseMessage(`Success: ${JSON.stringify(data)}`); // Update response message
      })
      .catch((error) => {
        console.error('Error:', error);
        setResponseMessage(`Error: ${error.toString()}`); // Update response message
      });
  };

  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setResponseMessage(''); // Clear response message when moving to the next section
    }
  };

  const handleLoopBack = () => {
    setCurrentSection(2); // Jump to the 3rd subsection (index 2)
    setResponseMessage(''); // Clear response message when moving to the loop back section
  };

  const sections = [
    {
      text: getRandomText(),
      message: 'Setup',
    },
    {
      text: getRandomText(),
      message: 'TurnOnIMUs',
    },
    {
      text: getRandomText(),
      message: 'InitialCalibration',
    },
    {
      text: getRandomText(),
      message: 'AlignWithVicon',
    },
    {
      text: getRandomText(),
      message: 'Run',
    },
    {
      text: getRandomText(),
      message: 'Redo',
    },
  ];

  const chartDetails = [
    { name: 'PelvisTX', dataIndex: 0, label: 'PelvisTX', backgroundColor: 'rgba(220, 220, 220, 0.2)', borderColor: 'rgba(220, 220, 220, 1)' },
    { name: 'PelvisTY', dataIndex: 1, label: 'PelvisTY', backgroundColor: 'rgba(151, 187, 205, 0.2)', borderColor: 'rgba(151, 187, 205, 1)' },
    { name: 'PelvisTZ', dataIndex: 2, label: 'PelvisTZ', backgroundColor: 'rgba(153, 255, 220, 0.2)', borderColor: 'rgba(151, 255, 220, 1)' },
    { name: 'KneeAngleR', dataIndex: 3, label: 'Knee Angle Right', backgroundColor: 'rgba(220, 220, 220, 0.2)', borderColor: 'rgba(220, 220, 220, 1)' },
    { name: 'KneeAngleL', dataIndex: 4, label: 'Knee Angle Left', backgroundColor: 'rgba(151, 187, 205, 0.2)', borderColor: 'rgba(151, 187, 205, 1)' },
    { name: 'AnkleAngleR', dataIndex: 5, label: 'Ankle Angle Right', backgroundColor: 'rgba(220, 220, 220, 0.2)', borderColor: 'rgba(220, 220, 220, 1)' },
    { name: 'AnkleAngleL', dataIndex: 6, label: 'Ankle Angle Left', backgroundColor: 'rgba(151, 187, 205, 0.2)', borderColor: 'rgba(151, 187, 205, 1)' },
  ];

  const currentSectionContent = sections[currentSection];

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <CRow>
            <CCol sm={5}>
              <h4 id="realTimeData" className="card-title mb-0">
                Real-Time Calculated Data
              </h4>
            </CCol>
            <CCol sm={7} className="d-none d-md-block">
              <CButtonGroup className="float-end me-3">
                {chartDetails.map((chart) => (
                  <CButton
                    color="outline-secondary"
                    key={chart.name}
                    className="mx-0"
                    active={selectedCharts.includes(chart.name)}
                    onClick={() => handleChartToggle(chart.name)}
                  >
                    {chart.name}
                  </CButton>
                ))}
              </CButtonGroup>
            </CCol>
          </CRow>
          <CButton
            color="outline-secondary"
            className="float-end me-3"
            onClick={toggleFullWidth}
            size="sm"
            style={{ marginTop: '10px', marginBottom: '10px' }}
          >
            <CIcon icon={cilResizeWidth} className='me-2' />
            Large Chart              
          </CButton>
        </CCardHeader>
        <CCardBody>
          <CRow>
            {selectedCharts.map((chartName) => {
              const chartDetail = chartDetails.find(chart => chart.name === chartName);
              return (
                <CCol md={fullWidth ? 12 : 6} key={chartName}>
                  <DataChart
                    dataIndex={chartDetail.dataIndex}
                    label={chartDetail.label}
                    backgroundColor={chartDetail.backgroundColor}
                    borderColor={chartDetail.borderColor}
                  />
                </CCol>
              );
            })}
          </CRow>
        </CCardBody>
      </CCard>
      <CCard className="mb-4">
        <CCardHeader>
          <h4 id="3dAnimation" className="card-title mb-0">
            Animation
          </h4>
        </CCardHeader>
        <CCardBody>
          <canvas ref={reactCanvas} style={{ width: '100%', height: '400px' }}></canvas>
        </CCardBody>
      </CCard>
      <CCard className="mb-4">
        <CCardHeader>
          <h4 className="card-title mb-0">ROS-OpenSimRT Control</h4>
        </CCardHeader>
        <CCardBody>
          <CCard className="mb-4">
            <CCardHeader>
              <h5 className="card-title mb-0">{currentSectionContent.message}</h5>
            </CCardHeader>
            <CCardBody>
              <p>{currentSectionContent.text}</p>
            </CCardBody>
          </CCard>
          {responseMessage && (
            <CCard className="mb-4">
              <CCardHeader>
                <h5>Response Message</h5>
              </CCardHeader>
              <CCardBody>
                <p>{responseMessage}</p>
              </CCardBody>
            </CCard>
          )}
          <div className="d-flex justify-content-end">
            {currentSection < 5 && (
              <CButton color="primary" onClick={() => handleButtonClick(currentSectionContent.message)}>
                Set
              </CButton>
            )}
            {currentSection === 5 && (
              <>
                <CButton color="primary" onClick={() => handleButtonClick(currentSectionContent.message)}>
                  Redo
                </CButton>
                <CButton color="secondary" className="ms-2" onClick={() => handleButtonClick(currentSectionContent.message, 1)}>
                  Finish
                </CButton>
                <CButton color="secondary" className="ms-2" onClick={handleLoopBack}>
                  Loop back
                </CButton>
              </>
            )}
            {currentSection < sections.length - 1 && (
              <CButton color="secondary" className="ms-2" onClick={handleNextSection}>
                Next
              </CButton>
            )}
          </div>
        </CCardBody>
      </CCard>

      {/* Button to trigger the BehaviorControlModal */}
      <CButton color="info" className="me-2" onClick={() => setVisible(true)}>
        Control Behavior
      </CButton>

      {/* Behavior Control Modal */}
      <BehaviorControlModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};

export default Dashboard;



