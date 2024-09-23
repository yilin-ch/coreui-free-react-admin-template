// MainCharts.js (DataChart component)
import React, { useContext, useState, useRef } from 'react';
import { CChartLine } from '@coreui/react-chartjs';
import { getStyle } from '@coreui/utils';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CButton, CButtonGroup, CFormInput, CModal, CModalBody, CModalFooter, CModalHeader } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilReload, cilZoomIn, cilZoomOut } from '@coreui/icons';
import { WebSocketContext } from './WebSocketProvider';  // Import the context

// Register zoom plugin
Chart.register(zoomPlugin);

const MAX_DATA_POINTS = 1000;  // Maximum size of the dataset
const DISPLAYED_DATA_POINTS = 100;  // Always display 100 points
const INITIAL_ZOOM_LEVEL = 1; // Start zoom level

// Custom sampling function
const sampleData = (data, interval) => {
  if (interval < 1) return data;  // If interval is less than 1, return the whole data
  return data.filter((_, index) => index % interval === 0).slice(-DISPLAYED_DATA_POINTS); // Sample the data
};

const DataChart = ({ dataIndex, label, backgroundColor, borderColor }) => {
  const { data, timestamps } = useContext(WebSocketContext);  // Access shared data and timestamps
  const chartRef = useRef(null);
  const [windowVisible, setWindowVisible] = useState(false);
  const [minY, setMinY] = useState(null);
  const [maxY, setMaxY] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM_LEVEL);  // Dynamic zoom level
  const [samplingInterval, setSamplingInterval] = useState(Math.floor(MAX_DATA_POINTS / DISPLAYED_DATA_POINTS));  // Initial interval for 100 points
  const [tempMinY, setTempMinY] = useState(minY);
  const [tempMaxY, setTempMaxY] = useState(maxY);

  // Adjust sampling based on zoom level
  const getVisibleData = () => {
    return sampleData(data.slice(-Math.floor(MAX_DATA_POINTS * zoomLevel)), samplingInterval);  // Get the latest subset of data
  };

  const getVisibleTimestamps = () => {
    return sampleData(timestamps.slice(-Math.floor(MAX_DATA_POINTS * zoomLevel)), samplingInterval);  // Get the latest subset of timestamps
  };

  const updateYRange = (newMinY, newMaxY) => {
    setMinY(newMinY);
    setMaxY(newMaxY);
    setWindowVisible(false);
  };

  // Zoom in: Decrease sampling interval and focus on fewer data points
  const zoomInX = () => {
    if (zoomLevel > 0.1) {
      const newZoomLevel = zoomLevel / 1.2;
      const newSamplingInterval = Math.max(1, Math.floor(samplingInterval / 1.2));  // Decrease interval for zoom in
      setZoomLevel(newZoomLevel);
      setSamplingInterval(newSamplingInterval);
    }
  };

  // Zoom out: Increase sampling interval to show more points
  const zoomOutX = () => {
    if (zoomLevel < 1) {
      const newZoomLevel = zoomLevel * 1.2;
      const newSamplingInterval = Math.min(Math.floor(MAX_DATA_POINTS / DISPLAYED_DATA_POINTS), Math.ceil(samplingInterval * 1.2));  // Increase interval for zoom out
      setZoomLevel(newZoomLevel);
      setSamplingInterval(newSamplingInterval);
    }
  };

  const resetZoom = () => {
    setZoomLevel(INITIAL_ZOOM_LEVEL);  // Reset zoom level
    setSamplingInterval(Math.floor(MAX_DATA_POINTS / DISPLAYED_DATA_POINTS));  // Reset interval
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ textAlign: 'center', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
        <h5>{label}</h5>
      </div>
      <div style={{ width: '100%', paddingTop: '50px' }}>
        <div style={{ width: '100%' }}>
          <CChartLine
            ref={chartRef}
            style={{ height: '400px', marginTop: '40px' }}
            data={{
              labels: getVisibleTimestamps(),
              datasets: [
                {
                  label,
                  backgroundColor,
                  borderColor,
                  pointBackgroundColor: borderColor,
                  pointBorderColor: "#fff",
                  data: getVisibleData().map(item => item[dataIndex]),
                },
              ],
            }}
            options={{
              animation: false,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                zoom: {
                  pan: {
                    enabled: true,
                    mode: 'xy',
                  },
                  zoom: {
                    wheel: {
                      enabled: false,
                    },
                    drag: {
                      enabled: false,
                    },
                    pinch: {
                      enabled: false,
                    },
                    mode: 'xy',
                  },
                },
              },
              scales: {
                x: {
                  grid: {
                    color: getStyle('--cui-border-color-translucent'),
                    drawOnChartArea: false,
                  },
                  ticks: {
                    color: getStyle('--cui-body-color'),
                    autoSkip: true,
                    maxTicksLimit: 10,
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    color: getStyle('--cui-border-color-translucent'),
                  },
                  ticks: {
                    color: getStyle('--cui-body-color'),
                    maxTicksLimit: 5,
                  },
                  min: minY == null ? undefined : parseFloat(minY),
                  max: maxY == null ? undefined : parseFloat(maxY),
                },
              },
              elements: {
                line: {
                  tension: 0.4,
                },
                point: {
                  radius: 0,
                },
              },
            }}
          />
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
        <CButton color="secondary" onClick={resetZoom} style={{ marginRight: '10px' }} size="sm">
          <CIcon icon={cilReload} className='me-2' />
          Reset X
        </CButton>
        <CButtonGroup role="group" aria-label="Zoom Buttons" className="float-end me-3" size="sm">
          <CButton color="secondary" onClick={zoomInX}>
            Zoom In X
          </CButton>
          <CButton color="secondary" onClick={zoomOutX}>
            Zoom Out X
          </CButton>
          <CButton color="secondary" onClick={() => setWindowVisible(true)}>
            Adjust Y
          </CButton>
        </CButtonGroup>
        <CModal alignment='center' visible={windowVisible} onClose={() => setWindowVisible(false)}>
          <CModalHeader onClose={() => setWindowVisible(false)}>
            Adjust Y-Axis
          </CModalHeader>
          <CModalBody>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CFormInput
                type='number'
                value={tempMinY || ''}
                onChange={(e) => setTempMinY(e.target.value)}
                placeholder='Min Y'
                style={{ marginRight: '10px' }}
              />
              <span style={{ marginRight: '10px' }}>to</span>
              <CFormInput
                type='number'
                value={tempMaxY || ''}
                onChange={(e) => setTempMaxY(e.target.value)}
                placeholder='Max Y'
                style={{ marginRight: '10px' }}
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color='secondary'
              onClick={() => updateYRange(tempMinY, tempMaxY)}
            >
              Submit
            </CButton>
          </CModalFooter>
        </CModal>
      </div>
    </div>
  );
};

export default DataChart;
