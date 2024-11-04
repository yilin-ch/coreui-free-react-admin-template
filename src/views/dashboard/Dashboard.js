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
import ProjectManager from './ProjectManager';

const Dashboard = () => {
  const [subjectInfo, setSubjectInfo] = useState({
    id: '',
    weight: '',
    height: ''
  });
  const [fileName, setFileName] = useState('');  // New state for file name
  const [filePath, setFilePath] = useState('');  // New state for file path
  const [selectedCharts, setSelectedCharts] = useState(['knee_angle_l', 'knee_angle_r']);
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

  return (
    <WebSocketProvider>  {/* Wrap the dashboard in the WebSocketProvider */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

        <ProjectManager /> 

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
