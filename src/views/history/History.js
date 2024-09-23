import React, { useEffect, useState, useRef } from "react";
import { CCard, CCardBody, CCardHeader, CListGroup, CListGroupItem, CSpinner, CButton, CButtonGroup, CRow, CCol, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CFormRange } from "@coreui/react";
import { CChartLine } from '@coreui/react-chartjs';
import CIcon from '@coreui/icons-react';
import { cilReload, cilZoomIn, cilZoomOut } from '@coreui/icons';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

const MAX_VISIBLE_POINTS = 100; // Maximum number of points visible at a time

const History = () => {
  const [filenames, setFilenames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState(['pelvis_tx']);
  const [startIndex, setStartIndex] = useState(0); // Control visible data range
  const [zoomLevel, setZoomLevel] = useState(MAX_VISIBLE_POINTS); // Zoom level controls how much data is visible
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
        setStartIndex(0); // Reset scrolling when new file is selected
      })
      .catch(error => {
        console.error('Error fetching file data:', error);
        setLoading(false);
      });
  };

  // Handle column selection toggle
  const handleColumnToggle = (columnName) => {
    setSelectedColumns(prevSelectedColumns =>
      prevSelectedColumns.includes(columnName)
        ? prevSelectedColumns.filter(column => column !== columnName)
        : [...prevSelectedColumns, columnName]
    );
  };

  // Handle zooming in and out by changing how much data is visible
  const handleZoom = (inOrOut) => {
    setZoomLevel((prevZoom) => {
      const newZoom = inOrOut === 'in' ? prevZoom - 20 : prevZoom + 20;
      return Math.max(20, Math.min(newZoom, chartData?.pelvis_tx?.length || MAX_VISIBLE_POINTS)); // Clamp the zoom level
    });
  };

  // Handle scrolling through the data using a range input (scrollbar)
  const handleScroll = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    setStartIndex(newIndex);
  };

  // Function to reset zoom and scrolling
  const resetZoomAndScroll = () => {
    setZoomLevel(MAX_VISIBLE_POINTS); // Reset zoom level
    setStartIndex(0); // Reset scroll to the beginning
  };

  // Dynamically generate chart details based on selected columns and visible data
  const getChartDetails = () => {
    if (!chartData) return {};
    
    return selectedColumns.reduce((acc, column) => {
      if (chartData[column]) {
        acc[column] = {
          label: column.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          data: chartData[column].slice(startIndex, startIndex + zoomLevel), // Only show data within the zoom/scroll range
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)"
        };
      }
      return acc;
    }, {});
  };

  const chartOptions = {
    animation: false,
    maintainAspectRatio: false,
    plugins: {
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
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0, // Remove points
        hitRadius: 10,
        hoverRadius: 0, // No hover effect on points
      },
    },
  };

  const chartDetails = getChartDetails();
  const maxScrollIndex = (chartData?.pelvis_tx?.length || 0) - zoomLevel;

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
            <div style={{ marginTop: '10px' }}>
            <CRow >
              <CCol sm={5}>
                <h4>Charts</h4>
              </CCol>
              <CCol sm={7}>
                <CDropdown className="float-end">
                  <CDropdownToggle color="primary">Select Charts</CDropdownToggle>
                  <CDropdownMenu>
                    {Object.keys(chartData).map((column) => (
                      <CDropdownItem key={column} onClick={() => handleColumnToggle(column)}>
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column)}
                          onChange={() => handleColumnToggle(column)}
                        />{' '}
                        {column.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </CDropdownItem>
                    ))}
                  </CDropdownMenu>
                </CDropdown>
              </CCol>
            </CRow>
            </div>
            

            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ overflowX: 'scroll', width: '100%', paddingTop: '50px' }}>
                {selectedColumns.map((chartType) => (
                  <div key={chartType} style={{ marginBottom: '20px' }}>
                    <h5 style={{ textAlign: 'center' }}>{chartDetails[chartType]?.label}</h5>
                    <CChartLine
                      ref={chartRef}
                      style={{ height: '400px', marginTop: '40px' }}
                      data={{
                        labels: Array.from({ length: chartDetails[chartType]?.data.length || 0 }, (_, i) => startIndex + i + 1),
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
              {/* Scroll bar for scrolling through data */}
              <CFormRange
                min="0"
                max={maxScrollIndex}
                value={startIndex}
                onChange={handleScroll}
              />
              <CButton color="secondary" onClick={resetZoomAndScroll} style={{ marginRight: '10px' }} size="sm">
                <CIcon icon={cilReload} className='me-2' />
                Reset
              </CButton>
              <CButtonGroup role="group" aria-label="Zoom Buttons" className="float-end me-3" size="sm">
                <CButton color="secondary" onClick={() => handleZoom('in')}>
                  <CIcon icon={cilZoomIn} className="me-2" />
                  Zoom In
                </CButton>
                <CButton color="secondary" onClick={() => handleZoom('out')}>
                  <CIcon icon={cilZoomOut} className="me-2" />
                  Zoom Out
                </CButton>
              </CButtonGroup>
            </div>
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default History;



