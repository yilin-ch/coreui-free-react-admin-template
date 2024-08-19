import React, { useEffect, useState, useRef } from "react";
import { CCard, CCardBody, CCardHeader, CListGroup, CListGroupItem, CSpinner, CButton, CButtonGroup, CRow, CCol, CFormRange } from "@coreui/react";
import { CChartLine } from '@coreui/react-chartjs';
import CIcon from '@coreui/icons-react';
import { cilCloudDownload, cilReload, cilZoomIn, cilZoomOut } from '@coreui/icons';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { getStyle } from '@coreui/utils';

Chart.register(zoomPlugin);

const History = () => {
  const [filenames, setFilenames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCharts, setSelectedCharts] = useState(['PelvisTX']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const dataLimit = 50;
  const chartRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:8000/get_filenames/')
      .then(response => response.json())
      .then(data => {
        setFilenames(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching filenames:', error);
        setLoading(false);
      });
  }, []);

  const handleFileClick = (filename) => {
    setLoading(true);
    setSelectedFile(filename);
    fetch(`http://localhost:8000/get_file_data/${filename}/`)
      .then(response => response.json())
      .then(data => {
        setChartData(data);
        setLoading(false);
        setMaxIndex(Math.max(data.pelvis_tx.length - dataLimit, 0));
      })
      .catch(error => {
        console.error('Error fetching file data:', error);
        setLoading(false);
      });
  };

  const handleChartToggle = (chartType) => {
    setSelectedCharts(prevSelectedCharts =>
      prevSelectedCharts.includes(chartType)
        ? prevSelectedCharts.filter(chart => chart !== chartType)
        : [...prevSelectedCharts, chartType]
    );
  };

  const handleRangeChange = (e) => {
    setCurrentIndex(parseInt(e.target.value, 10));
  };

  const getLimitedData = (data) => {
    return data.slice(currentIndex, currentIndex + dataLimit);
  };

  const chartOptions = {
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
            enabled: true,
          },
          drag: {
            enabled: true,
          },
          pinch: {
            enabled: true,
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

  const chartDetails = {
    PelvisTX: {
      label: 'Pelvis TX',
      data: getLimitedData(chartData?.pelvis_tx || []),
      backgroundColor: "rgba(220, 220, 220, 0.2)",
      borderColor: "rgba(220, 220, 220, 1)"
    },
    PelvisTY: {
      label: 'Pelvis TY',
      data: getLimitedData(chartData?.pelvis_ty || []),
      backgroundColor: "rgba(151, 187, 205, 0.2)",
      borderColor: "rgba(151, 187, 205, 1)"
    },
    PelvisTZ: {
      label: 'Pelvis TZ',
      data: getLimitedData(chartData?.pelvis_tz || []),
      backgroundColor: "rgba(153, 255, 220, 0.2)",
      borderColor: "rgba(151, 255, 220, 1)"
    },
    KneeAngleR: {
      label: 'Knee Angle Right',
      data: getLimitedData(chartData?.knee_angle_r || []),
      backgroundColor: "rgba(220, 220, 220, 0.2)",
      borderColor: "rgba(220, 220, 220, 1)"
    },
    KneeAngleL: {
      label: 'Knee Angle Left',
      data: getLimitedData(chartData?.knee_angle_l || []),
      backgroundColor: "rgba(151, 187, 205, 0.2)",
      borderColor: "rgba(151, 187, 205, 1)"
    },
    AnkleAngleR: {
      label: 'Ankle Angle Right',
      data: getLimitedData(chartData?.ankle_angle_r || []),
      backgroundColor: "rgba(220, 220, 220, 0.2)",
      borderColor: "rgba(220, 220, 220, 1)"
    },
    AnkleAngleL: {
      label: 'Ankle Angle Left',
      data: getLimitedData(chartData?.ankle_angle_l || []),
      backgroundColor: "rgba(151, 187, 205, 0.2)",
      borderColor: "rgba(151, 187, 205, 1)"
    },
  };

  return (
    <CCard>
      <CCardHeader>
        File List
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <CSpinner />
        ) : (
          <CListGroup>
            {filenames.map((filename, index) => (
              <CListGroupItem key={index} onClick={() => handleFileClick(filename)}>
                {filename}
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
        {chartData && (
          <>
            <CRow>
              <CCol sm={5}>
              
              </CCol>
              <CCol sm={7}>
                <CButtonGroup className="float-end me-3">
                  {Object.keys(chartDetails).map((key) => (
                    <CButton
                      color="outline-secondary"
                      key={key}
                      className="mx-0"
                      active={selectedCharts.includes(key)}
                      onClick={() => handleChartToggle(key)}
                      style={{ marginTop: '10px', marginBottom: '10px' }}
                    >
                      {key}
                    </CButton>
                  ))}
                </CButtonGroup>
              </CCol>
            </CRow>
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ overflowX: 'scroll', width: '100%', paddingTop: '50px' }}>
                <div style={{ width: Math.max(1000, getLimitedData(chartDetails[selectedCharts[0]]?.data || []).length * 10) }}>
                  {selectedCharts.map((chartType) => (
                    <div key={chartType} style={{ marginBottom: '20px' }}> 
                    <h5 style={{ textAlign: 'center' }}>{chartDetails[chartType]?.label}</h5> {/* Add this line to display the chart name */}


                    <CChartLine
                      key={chartType}
                      ref={chartRef}
                      style={{ height: '400px', marginTop: '40px' }}
                      data={{
                        labels: Array.from({ length: getLimitedData(chartDetails[chartType]?.data || []).length }, (_, i) => i + 1 + currentIndex),
                        datasets: [
                          {
                            label: chartDetails[chartType]?.label,
                            backgroundColor: chartDetails[chartType]?.backgroundColor,
                            borderColor: chartDetails[chartType]?.borderColor,
                            pointBackgroundColor: chartDetails[chartType]?.borderColor,
                            pointBorderColor: "#fff",
                            data: chartDetails[chartType]?.data,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
                <CButton color="secondary" onClick={resetZoom} style={{ marginRight: '10px' }} size="sm">
                  <CIcon icon={cilReload} className='me-2' />
                  Reset
                </CButton>
                <CButtonGroup role="group" aria-label="Zoom Buttons" className="float-end me-3" size="sm">
                  <CButton color="secondary" onClick={() => zoomIn('x')}>
                    Zoom In X
                  </CButton>
                  <CButton color="secondary" onClick={() => zoomOut('x')}>
                    Zoom Out X
                  </CButton>
                  <CButton color="secondary" onClick={() => zoomIn('y')}>
                    Zoom In Y
                  </CButton>
                  <CButton color="secondary" onClick={() => zoomOut('y')}>
                    Zoom Out Y
                  </CButton>
                </CButtonGroup>
              </div>
              <CFormRange
                min="0"
                max={maxIndex}
                value={currentIndex}
                onChange={handleRangeChange}
              />
            </div>
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default History;



