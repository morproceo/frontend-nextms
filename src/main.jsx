import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// StrictMode intentionally disabled: it double-mounts effects in dev, which
// breaks one-shot resources (ElevenLabs voice signed URLs are consumed once;
// the second mount tries to send on a closing WebSocket). Re-enable once
// every effect we care about is idempotent under dual mount.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
