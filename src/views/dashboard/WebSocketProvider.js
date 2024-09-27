import React, { createContext, useState, useEffect, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { unstable_batchedUpdates } from 'react-dom';

// const MAX_DATA_POINTS = 100;
// const dataIndex = 10;

// const generateMockData = (numPoints, dataIndex) => {
//   return Array.from({ length: numPoints }, (_, i) => Math.sin(i / 10 + dataIndex) + Math.random() * 0.5);
// };

// // Generate mock timestamps
// const generateMockTimestamps = (numPoints) => {
//   const now = new Date();
//   return Array.from({ length: numPoints }, (_, i) => new Date(now.getTime() + i * 1000).toLocaleTimeString());
// };

// Create a context to share WebSocket data
export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const dataRef = useRef([]);
  const timestampsRef = useRef([]);
  const [data, setData] = useState([]); // Shared data across all charts
  const [timestamps, setTimestamps] = useState([]); // Shared timestamps across all charts
  
  const { lastMessage } = useWebSocket('ws://localhost:8000/ws/bridge/', {
    shouldReconnect: () => true,
  });

  // const [mockData, setMockData] = useState([]);
  // const [mockTimestamps, setMockTimestamps] = useState([]);
  // const dataBufferRef = useRef([]);
  // const tsBufferRef = useRef([]);

  // // Columns to skip conversion (3rd, 4th, and 5th columns, index starts from 0)
  // const skipConversionIndices = [3, 4, 5];

  // // Helper function to convert radians to degrees
  // const radToDeg = (rad) => rad * (180 / Math.PI);

  // // Function to apply the conversion logic
  // const convertData = (newData) => {
  //   // Iterate through each data entry and convert relevant columns
  //   return newData.map((entry, index) => {
  //     // Skip the conversion for the 3rd, 4th, and 5th columns (indices 2, 3, 4)
  //     if (skipConversionIndices.includes(index)) {
  //       return entry; // No conversion
  //     }
  //     // Convert the data from radians to degrees
  //     return radToDeg(entry);
  //   });
  // };

  // // Update mock data every 10ms
  // useEffect(() => {

  //   const dataInterval = setInterval(() => {
  //     tsBufferRef.current = [
  //       ...tsBufferRef.current,
  //       ...generateMockTimestamps(1),
  //     ].slice(-MAX_DATA_POINTS);
  //     dataBufferRef.current = [
  //       ...dataBufferRef.current,
  //       ...generateMockData(1, dataIndex),
  //     ].slice(-MAX_DATA_POINTS); // Limit buffer size to MAX_DATA_POINTS
  //   }, 10); // Update every 10ms

  //   return () => clearInterval(dataInterval); // Cleanup on unmount
  // }, [dataIndex]);

  // Function to update data every 150ms
  useEffect(() => {
    const interval = setInterval(() => {
      unstable_batchedUpdates(() => {
        setData([...dataRef.current]); // Update with the latest data in batches
        setTimestamps([...timestampsRef.current]); // Update with the latest timestamps in batches
      });
    }, 150);  // Throttle updates to 150ms

    return () => clearInterval(interval);  // Cleanup interval on component unmount
  }, []);

  // WebSocket data listener
  useEffect(() => {
    if (lastMessage !== null) {
      const message = JSON.parse(lastMessage.data);
      if (message.msg && message.msg.data) {
        const newData = message.msg.data;
        const newTimestamp = message.msg.time;
        // const date = new Date(newTimestamp * 1000);
        // const convertedTS = date.toLocaleTimeString('en-US', { hour12: false });

        // // Convert the data, applying radian-to-degree conversion except for the 3rd, 4th, and 5th columns
        // const convertedData = convertData(newData);

        // Update the refs
        // console.log('What data looks like:', newData);
        dataRef.current = [...dataRef.current, newData].slice(-1000); // Keep latest 1000 entries
        timestampsRef.current = [...timestampsRef.current, newTimestamp].slice(-1000);
      }
    }
  }, [lastMessage]);

  return (
    <WebSocketContext.Provider value={{ data, timestamps }}>
      {children}
    </WebSocketContext.Provider>
  );
};
