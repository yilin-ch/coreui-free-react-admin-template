import React, { createContext, useState, useEffect, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { unstable_batchedUpdates } from 'react-dom';

// Create a context to share WebSocket data
export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const dataRef = useRef([]);
  const timestampsRef = useRef([]);
  const logsRef = useRef([]);

  const [data, setData] = useState([]); // Shared data across all charts
  const [timestamps, setTimestamps] = useState([]); // Shared timestamps across all charts
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  
  const { lastMessage : lastBridgeMessage} = useWebSocket('ws://localhost:8000/ws/bridge/', {
    shouldReconnect: () => true,
  });

  const { lastMessage : lastLogMessage } = useWebSocket(
    'ws://localhost:8000/ws/flexbelogs/',
    { shouldReconnect: () => true }
  )

  // Function to update data every 150ms
  useEffect(() => {
    const interval = setInterval(() => {
      unstable_batchedUpdates(() => {
        setData([...dataRef.current]); // Update with the latest data in batches
        setTimestamps([...timestampsRef.current]); // Update with the latest timestamps in batches
        setLogs([...logsRef.current]);
      });
    }, 150);  // Throttle updates to 150ms

    return () => clearInterval(interval);  // Cleanup interval on component unmount
  }, []);

  // WebSocket data listener
  useEffect(() => {
    if (lastBridgeMessage !== null) {
      const message = JSON.parse(lastBridgeMessage.data);
      if (message.msg && message.msg.data) {
        const newData = message.msg.data;
        const newTimestamp = message.msg.time;
        dataRef.current = [...dataRef.current, newData].slice(-1000); // Keep latest 1000 entries
        timestampsRef.current = [...timestampsRef.current, newTimestamp].slice(-1000);
      }
    }
  }, [lastBridgeMessage]);

  // WebSocket data listener for 'logs'
  useEffect(() => {
    if (lastLogMessage !== null) {
      const message = JSON.parse(lastLogMessage.data);
      // console.log(message);
      if (message.log && message.log.msg && message.log.msg.text) {
        const newLog = message.log.msg.text;
        // console.log(newLog);
        logsRef.current = [...logsRef.current, newLog];
      }
    }
  }, [lastLogMessage]);

  return (
    <WebSocketContext.Provider value={{ data, timestamps, logs }}>
      {children}
    </WebSocketContext.Provider>
  );
};
