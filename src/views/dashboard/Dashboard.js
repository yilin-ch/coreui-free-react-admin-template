import React, { useEffect, useRef, useState } from 'react';
import { Engine, Scene } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Axis,Space } from '@babylonjs/core/Maths/math';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';

import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CButton,
  CButtonGroup,
  CRow,
  CCardText,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CForm,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import { cilResizeWidth } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import DataChart from './MainCharts';
import BehaviorControlModal from './BehaviorControlModal';
import { WebSocketProvider } from './WebSocketProvider'; // Import the WebSocketProvider
import ROSControlSection from './ROSControlSection';

const Dashboard = () => {
  const [subjectInfo, setSubjectInfo] = useState({
    id: '',
    weight: '',
    height: ''
  });
  const [fileName, setFileName] = useState('');  // New state for file name
  const [filePath, setFilePath] = useState('');  // New state for file path
  const [selectedCharts, setSelectedCharts] = useState(['pelvis_tx']);
  const [fullWidth, setFullWidth] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [responseMessage, setResponseMessage] = useState('');
  const [branch, setBranch] = useState(0);
  const [ctrlVisible, setCtrlVisible] = useState(false);
  const [recordVisible, setRecordVisible] = useState(false);
  const reactCanvas = useRef(null);
  const cameraRef = useRef(null);

  const chartDetails = [
    'pelvis_tilt',
    'pelvis_list',
    'pelvis_rotation',
    'pelvis_tx',
    'pelvis_ty',
    'pelvis_tz',
    'hip_flexion_r',
    'hip_adduction_r',
    'hip_rotation_r',
    'hip_flexion_l',
    'hip_adduction_l',
    'hip_rotation_l',
    'lumbar_extension',
    'lumbar_bending',
    'lumbar_rotation',
    'knee_angle_r',
    'knee_angle_l',
    'ankle_angle_r',
    'ankle_angle_l',
  ];

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(reactCanvas.current, true);
      const scene = new Scene(engine);

      const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 3, new Vector3(0, 1, 0), scene);
      camera.attachControl(reactCanvas.current, true);
      cameraRef.current = camera;

      const light = new HemisphericLight('light', new Vector3(1, 1, 0), scene);
      light.intensity = 0.7;

      SceneLoader.Append('', 'models/scene.babylon', scene, function (meshes, particleSystems, skeletons) {
        scene.createDefaultCameraOrLight(true, true, true);
        scene.createDefaultEnvironment();

        // Create a poses object
        var poses = {
          default: {
              sacrum: { rotation: new Vector3(0.1, 0, 0) },
              // Add other bones and their default rotations here
          },
          pose1: {
              sacrum: { rotation: new Vector3(-Math.PI/2, 0, 0) },
              //l_pelvis: { rotation: new Vector3(0, -Math.PI / 4, 0) },
              //r_pelvis: { rotation: new Vector3(0, -Math.PI / 4, 0) },
              l_femur: { rotation: new Vector3(0, -Math.PI / 4, 0) },
              r_femur: { rotation: new Vector3(0, -Math.PI / 4, 0) },
              l_tibia: { rotation: new Vector3(0, 2*Math.PI / 4, 0) },
              r_tibia: { rotation: new Vector3(0, 2*Math.PI / 4, 0) },
              l_talus: { rotation: new Vector3(0, -Math.PI / 4, 0) },
              r_talus: { rotation: new Vector3(0, -Math.PI / 4, 0) },
              // Add other bones and their rotations for pose1
          },
          // Add more poses as needed
        };

        // Function to apply a pose
        function applyPose(poseName) {
          var pose = poses[poseName];
          for (var boneName in pose) {
              var node = scene.getNodeByName(boneName);
              if (node) {
                  node.rotation = pose[boneName].rotation.clone();
              }
          }
        }

        // Animation loop
        var angle = 0;
        scene.registerBeforeRender(function () {
            angle += 0.01;
            //applyPose('default'); // Change this to apply different poses
            applyPose('pose1'); // Change this to apply different poses
            
            // Optional: Add some continuous animation
            var pelvis = scene.getNodeByName("sacrum");
            if (pelvis) {
		            //because i added an angle to the origin, now the local and global dont align anymore
                //pelvis.rotate(BABYLON.Axis.Y, angle, BABYLON.Space.LOCAL);
                pelvis.rotate(Axis.Z, angle, Space.GLOBAL);
            }
        });

      });

      engine.runRenderLoop(() => {
        scene.render();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSubjectInfo({ ...subjectInfo, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Subject Information:", subjectInfo);
    // Perform validation and processing here, e.g., sending data to backend
  };

  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.radius -= 0.5;
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.radius += 0.5;
    }
  };

  const toggleFullWidth = () => {
    setFullWidth(!fullWidth);
  };

  const handleChartToggle = (chartName) => {
    setSelectedCharts((prevSelectedCharts) =>
      prevSelectedCharts.includes(chartName)
        ? prevSelectedCharts.filter((chart) => chart !== chartName)
        : [...prevSelectedCharts, chartName]
    );
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
    if (!fileName || !filePath) {
      alert('Please provide both filename and file path');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:8000/set_name_and_path/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: fileName, filepath: filePath }),
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
  

  const [startedRecord, setStartedRecord] = useState(false);
  const [recordDisabled, setRecordDisabled] = useState(false);
  const [stopDisabled, setStopDisabled] = useState(true);
  const [re_recordDisabled, setRe_recordDisabled] = useState(true);

  return (
    <WebSocketProvider>  {/* Wrap the dashboard in the WebSocketProvider */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <CCard className="mb-4" style={{ flex: 1 }}>
          <CCardHeader>
            <h4 className="card-title mb-0">Subject Information</h4>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol>
                  <CFormLabel htmlFor="id">Subject ID</CFormLabel>
                  <CInputGroup>
                    <CFormInput
                      type="text"
                      id="id"
                      name="id"
                      value={subjectInfo.id}
                      onChange={handleInputChange}
                      placeholder="Enter subject ID"
                    />
                  </CInputGroup>
                </CCol>
                <CCol>
                  <CFormLabel htmlFor="weight">Weight (kg)</CFormLabel>
                  <CInputGroup>
                    <CFormInput
                      type="number"
                      id="weight"
                      name="weight"
                      value={subjectInfo.weight}
                      onChange={handleInputChange}
                      placeholder="Enter weight"
                    />
                  </CInputGroup>
                </CCol>
                <CCol>
                  <CFormLabel htmlFor="height">Height (cm)</CFormLabel>
                  <CInputGroup>
                    <CFormInput
                      type="number"
                      id="height"
                      name="height"
                      value={subjectInfo.height}
                      onChange={handleInputChange}
                      placeholder="Enter height"
                    />
                  </CInputGroup>
                </CCol>
              </CRow>
              <CButton color="primary" type="submit">
                Submit
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>

        <ROSControlSection />

        {/* <CCard className="mb-4" style={{ flex: 1 }}>
          <CCardHeader>
            <h4 className="card-title mb-0">ROS-OpenSimRT Control</h4>
          </CCardHeader>
          <CCardBody>
            <CCardText className="mt-3">
              This section allows you to control and set up the ROS-OpenSimRT system, including configurations for the IMU and insole sensors.
            </CCardText>
            <CCardText className="mt-3">
              Use the buttons below to initialize, calibrate, and run the system as needed.
            </CCardText>
            <CButton color="primary" className="me-2" onClick={() => setCtrlVisible(true)}>
              Control Behavior
            </CButton>

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
                  <CFormLabel htmlFor="filePath">File Path</CFormLabel>
                  <CInputGroup>
                    <CFormInput
                      type="text"
                      id="filePath"
                      name="filePath"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                      placeholder="Enter file path"
                    />
                  </CInputGroup>
                </CCol>
                <CCol>
                  <CButton color="primary" onClick={handleSetNameAndPath} style={{ marginTop: '30px' }}>
                    Submit
                  </CButton>
                </CCol>
              </CRow>
              {responseMessage && (
                <p>{responseMessage}</p>
              )}
            </CForm>

            <div style={{ marginTop: '10px' }}>
              <CButton
                color="primary"
                className="me-2"
                onClick={() => {
                  setRecordVisible(true);
                }}
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
                }}
                disabled={re_recordDisabled}
              >
                Record Another
              </CButton>
            </div>
          </CCardBody>
          <CModal alignment="center" visible={recordVisible} onClose={() => setRecordVisible(false)}>
            <CModalHeader onClose={() => setRecordVisible(false)}>
              Start Recording
            </CModalHeader>
            <CModalBody>
              <p>
                Please make sure you have done all the setup before recording.
              </p>
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
        </CCard> */}

        <BehaviorControlModal visible={ctrlVisible} onClose={() => setCtrlVisible(false)} />

        <CCard className="mb-4">
          <CCardHeader>
            <CRow>
              <CCol sm={5}>
                <h4 id="realTimeData" className="card-title mb-0">
                  Real-Time Calculated Data
                </h4>
              </CCol>
              <CCol sm={7} className="d-none d-md-block">
                <CDropdown className="float-end">
                  <CDropdownToggle color="primary">Select Charts</CDropdownToggle>
                  <CDropdownMenu>
                    {chartDetails.map((chartName) => (
                      <CDropdownItem key={chartName} onClick={() => handleChartToggle(chartName)}>
                        <input
                          type="checkbox"
                          checked={selectedCharts.includes(chartName)}
                          onChange={() => handleChartToggle(chartName)}
                        />{' '}
                        {chartName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </CDropdownItem>
                    ))}
                  </CDropdownMenu>
                </CDropdown>
              </CCol>
            </CRow>
            <CButton
              color="outline-secondary"
              className="float-end me-3"
              onClick={toggleFullWidth}
              size="sm"
              style={{ marginTop: '10px', marginBottom: '10px' }}
            >
              <CIcon icon={cilResizeWidth} className="me-2" />
              Large Chart
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CRow>
              {selectedCharts.map((chartName) => (
                <CCol md={fullWidth ? 12 : 6} key={chartName}>
                  <DataChart
                    dataIndex={chartDetails.indexOf(chartName)}
                    label={chartName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  />
                </CCol>
              ))}
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-4">
          <CCardHeader>
            <h4 id="3dAnimation" className="card-title mb-0">
              Motion Viewer
            </h4>
          </CCardHeader>
          <CCardBody>
            <div style={{ position: 'relative', height: '100%' }}>
              <canvas ref={reactCanvas} style={{ width: '100%', height: '100%' }}></canvas>
              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                <CButtonGroup>
                  <CButton color="primary" onClick={handleZoomIn}>Zoom In</CButton>
                  <CButton color="secondary" onClick={handleZoomOut}>Zoom Out</CButton>
                </CButtonGroup>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </WebSocketProvider>  
  );
};

export default Dashboard;
