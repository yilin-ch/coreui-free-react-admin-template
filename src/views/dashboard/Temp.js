// src/views/history/History.js
import React, { useEffect, useState } from "react";
import { CCard, CCardBody, CCardHeader, CListGroup, CListGroupItem, CSpinner, CButton, CButtonGroup, CRow, CCol, CFormRange } from "@coreui/react";
import { CChartLine } from '@coreui/react-chartjs';
import CIcon from '@coreui/icons-react';
import { cilCloudDownload } from '@coreui/icons';

const History = () => {
  const [filenames, setFilenames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedChart, setSelectedChart] = useState('Pelvis');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const dataLimit = 50;

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

  const handleChartChange = (chartType) => {
    setSelectedChart(chartType);
  };

  const handleRangeChange = (e) => {
    setCurrentIndex(parseInt(e.target.value, 10));
  };

  const getLimitedData = (data) => {
    return data.slice(currentIndex, currentIndex + dataLimit);
  };

  const PelvisChart = () => (
    <div style={{ width: '100%' }}>
      <CChartLine
        style={{ height: '400px', marginTop: '40px' }}
        data={{
          labels: Array.from({ length: getLimitedData(chartData.pelvis_tx).length }, (_, i) => i + 1 + currentIndex),
          datasets: [
            {
              label: 'Pelvis TX',
              backgroundColor: "rgba(220, 220, 220, 0.2)",
              borderColor: "rgba(220, 220, 220, 1)",
              pointBackgroundColor: "rgba(220, 220, 220, 1)",
              pointBorderColor: "#fff",
              data: getLimitedData(chartData.pelvis_tx),
            },
            {
              label: 'Pelvis TY',
              backgroundColor: "rgba(151, 187, 205, 0.2)",
              borderColor: "rgba(151, 187, 205, 1)",
              pointBackgroundColor: "rgba(151, 187, 205, 1)",
              pointBorderColor: "#fff",
              data: getLimitedData(chartData.pelvis_ty),
            },
            {
              label: 'Pelvis TZ',
              backgroundColor: "rgba(153, 255, 220, 0.2)",
              borderColor: "rgba(151, 255, 220, 1)",
              pointBackgroundColor: "rgba(151, 255, 220, 1)",
              pointBorderColor: "#fff",
              data: getLimitedData(chartData.pelvis_tz),
            },
          ],
        }}
        options={{
          animation: false,
          maintainAspectRatio: false,
        }}
      />
      <CFormRange
        min="0"
        max={maxIndex}
        value={currentIndex}
        onChange={handleRangeChange}
      />
    </div>
  );

  const KneeChart = () => (
    <div style={{ width: '100%' }}>
      <CChartLine
        style={{ height: '400px', marginTop: '40px' }}
        data={{
          labels: Array.from({ length: getLimitedData(chartData.knee_angle_r).length }, (_, i) => i + 1 + currentIndex),
          datasets: [
            {
              label: 'Knee Angle Right',
              backgroundColor: "rgba(220, 220, 220, 0.2)",
              borderColor: "rgba(220, 220, 220, 1)",
              pointBackgroundColor: "rgba(220, 220, 220, 1)",
              pointBorderColor: "#fff",
              data: getLimitedData(chartData.knee_angle_r),
            },
            {
              label: 'Knee Angle Left',
              backgroundColor: "rgba(151, 187, 205, 0.2)",
              borderColor: "rgba(151, 187, 205, 1)",
              pointBackgroundColor: "rgba(151, 187, 205, 1)",
              pointBorderColor: "#fff",
              data: getLimitedData(chartData.knee_angle_l),
            },
          ],
        }}
        options={{
          animation: false,
          maintainAspectRatio: false,
        }}
      />
      <CFormRange
        min="0"
        max={maxIndex}
        value={currentIndex}
        onChange={handleRangeChange}
      />
    </div>
  );

  const AnkleChart = () => (
    <div style={{ width: '100%' }}>
      <CChartLine
        style={{ height: '400px', marginTop: '40px' }}
        data={{
          labels: Array.from({ length: getLimitedData(chartData.ankle_angle_r).length }, (_, i) => i + 1 + currentIndex),
          datasets: [
            {
              label: 'Ankle Angle Right',
              backgroundColor: "rgba(220, 220, 220, 0.2)",
              borderColor: "rgba(220, 220, 220, 1)",
              pointBackgroundColor: "rgba(220, 220, 220, 1)",
              pointBorderColor: "#fff",
              data: getLimitedData(chartData.ankle_angle_r),
            },
            {
              label: 'Ankle Angle Left',
              backgroundColor: "rgba(151, 187, 205, 0.2)",
              borderColor: "rgba(151, 187, 205, 1)",
              pointBackgroundColor: "rgba(151, 187, 205, 1)",
              pointBorderColor: "#fff",
              data: getLimitedData(chartData.ankle_angle_l),
            },
          ],
        }}
        options={{
          animation: false,
          maintainAspectRatio: false,
        }}
      />
      <CFormRange
        min="0"
        max={maxIndex}
        value={currentIndex}
        onChange={handleRangeChange}
      />
    </div>
  );

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
              <CCol sm={7} className="d-none d-md-block">
                <CButton color="primary" className="float-end">
                  <CIcon icon={cilCloudDownload} />
                </CButton>
                <CButtonGroup className="float-end me-3">
                  {['Pelvis', 'Knees', 'Ankles'].map((value) => (
                    <CButton
                      color="outline-secondary"
                      key={value}
                      className="mx-0"
                      active={value === selectedChart}
                      onClick={() => handleChartChange(value)}
                    >
                      {value}
                    </CButton>
                  ))}
                </CButtonGroup>
              </CCol>
            </CRow>
            {selectedChart === 'Pelvis' && <PelvisChart />}
            {selectedChart === 'Knees' && <KneeChart />}
            {selectedChart === 'Ankles' && <AnkleChart />}
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default History;



