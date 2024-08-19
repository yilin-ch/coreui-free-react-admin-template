import React, { useState, useEffect, useRef } from 'react';
import { CChartLine } from '@coreui/react-chartjs';
import { getStyle } from '@coreui/utils';
import useWebSocket from 'react-use-websocket';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CButton, CButtonGroup } from '@coreui/react';
import CIcon from '@coreui/icons-react'
import { 
  cilReload,
  cilZoomIn,
  cilZoomOut,
 } from '@coreui/icons'

Chart.register(zoomPlugin);

const useRealTimeData = () => {
  const [data, setData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);

  const { lastMessage } = useWebSocket('ws://localhost:8000/ws/bridge/', {
    shouldReconnect: (closeEvent) => true, // Will attempt to reconnect on all close events
  });

  useEffect(() => {
    if (lastMessage !== null) {
      const message = JSON.parse(lastMessage.data);
      console.log('Received message:', message);
      if (message.msg && message.msg.data) {
        const newData = message.msg.data;
        const newTimestamp = new Date().toISOString();
        setData(prevData => [...prevData, newData]);
        setTimestamps(prevTimestamps => [...prevTimestamps, newTimestamp]);
      }
    }
  }, [lastMessage]);

  return { data, timestamps };
};

const chartOptions = {
  animation: false,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // Hide the legend in the chart
    },
    zoom: {
      pan: {
        enabled: true,
        mode: 'xy',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        drag: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: 'xy',
        limits: {
          x: {min: 'original', max: '200%'},
          y: {min: 'original', max: 'original'}
        }
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
        maxTicksLimit: 10, // Adjust this value to show fewer labels
      },
    },
    y: {
      beginAtZero: true,
      border: {
        color: getStyle('--cui-border-color-translucent'),
      },
      grid: {
        color: getStyle('--cui-border-color-translucent'),
      },
      ticks: {
        color: getStyle('--cui-body-color'),
        maxTicksLimit: 5,
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 0,
      hitRadius: 10,
      hoverRadius: 4,
      hoverBorderWidth: 3,
    },
  },
};

const DataChart = ({ dataIndex, label, backgroundColor, borderColor }) => {
  const chartRef = useRef(null);
  const { data, timestamps } = useRealTimeData();
  const chartData = data.map(item => item[dataIndex]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data.labels = timestamps;
      chartRef.current.data.datasets[0].data = chartData;
      chartRef.current.update();
    }
  }, [data, timestamps]);

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const zoomIn = (axis) => {
    if (chartRef.current) {
      const zoomOptions = {
        x: axis === 'x' ? 1.1 : 1,
        y: axis === 'y' ? 1.1 : 1,
      };
      chartRef.current.zoom(zoomOptions);
    }
  };

  const zoomOut = (axis) => {
    if (chartRef.current) {
      const zoomOptions = {
        x: axis === 'x' ? 0.9 : 1,
        y: axis === 'y' ? 0.9 : 1,
      };
      chartRef.current.zoom(zoomOptions);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ textAlign: 'center', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
        <h5>{label}</h5>
      </div>
      <div style={{ overflowX: 'scroll', width: '100%', paddingTop: '50px' }}>
        <div style={{ width: Math.max(1000, timestamps.length * 10) }}>
          <CChartLine
            ref={chartRef}
            style={{ height: '400px', marginTop: '40px' }}
            data={{
              labels: timestamps,
              datasets: [
                {
                  label,
                  backgroundColor,
                  borderColor,
                  pointBackgroundColor: borderColor,
                  pointBorderColor: "#fff",
                  data: chartData,
                },
              ],
            }}
            options={chartOptions}
          />
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
        <CButton color="secondary" onClick={resetZoom} style={{ marginRight: '10px' }} size="sm">
          <CIcon icon={cilReload} className='me-2'/>
          Reset
        </CButton>
        <CButtonGroup role="group" aria-label="Zoom Buttons" className="float-end me-3" size="sm">
          <CButton color="secondary" onClick={() => zoomIn('x')} >
            {/* <CIcon icon={cilZoomIn} className='me-2'/> */}
            Zoom In X
          </CButton>
          <CButton color="secondary" onClick={() => zoomOut('x')} >
            {/* <CIcon icon={cilZoomOut} className='me-2'/> */}
            Zoom Out X
          </CButton>
          <CButton color="secondary" onClick={() => zoomIn('y')} >
            {/* <CIcon icon={cilZoomIn} className='me-2'/> */}
            Zoom In Y
          </CButton>
          <CButton color="secondary" onClick={() => zoomOut('y')} >
            {/* <CIcon icon={cilZoomOut} className='me-2'/> */}
            Zoom Out Y
          </CButton>
        </CButtonGroup>
      </div>
    </div>
  );
};

export default DataChart;



