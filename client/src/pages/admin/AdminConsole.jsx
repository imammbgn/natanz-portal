import { useState } from 'react';
import Header from '../../components/Header';
import api from '../../api';

const EXAMPLES = [
  { label: 'Hello World', code: 'console.log("Hello from Natanz Cloud!");' },
  { label: 'Math', code: 'const result = Math.pow(2, 10);\nconsole.log("2^10 =", result);\nconsole.log("PI =", Math.PI);' },
  { label: 'Array Ops', code: 'const users = [\n  { name: "Alice", role: "admin" },\n  { name: "Bob", role: "customer" },\n  { name: "Charlie", role: "auditor" },\n];\n\nconst names = users.map(u => u.name);\nconsole.log("Users:", names);\nconsole.log("Total:", users.length);' },
  { label: 'JSON', code: 'const json = \'{"service":"Natanz Cloud","version":"1.0.0","status":"running"}\';\nconst data = JSON.parse(json);\nconsole.log("Service:", data.service);\nconsole.log("Version:", data.version);' },
  { label: 'Date', code: 'const now = new Date();\nconsole.log("ISO:", now.toISOString());\nconsole.log("Local:", now.toLocaleString());' },
];

export default function AdminConsole() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]);

  async function runCode() {
    if (!code.trim() || running) return;
    setRunning(true);
    setOutput(null);
    try {
      const res = await api.post('/admin/console/run', { code });
      const result = res.data.data;
      setOutput(result);
      setHistory((prev) => [{ code: code.trim(), ...result, time: new Date() }, ...prev].slice(0, 20));
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || 'Request failed - make sure the server is running.';
      setOutput({ output: `Request Error: ${msg}\n\nStatus: ${err.response?.status || 'N/A'}\nURL: /api/admin/console/run`, error: true, executionTime: 0 });
    } finally {
      setRunning(false);
    }
  }

  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newCode = code.slice(0, selectionStart) + '  ' + code.slice(selectionEnd);
      setCode(newCode);
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = selectionStart + 2; }, 0);
    }
  }

  return (
    <>
      <Header title="Script Console" />
      <div className="page-content">
        <div className="console-layout">
          <div className="console-editor-panel">
            <div className="console-toolbar">
              <div className="console-lang-badge">Node.js</div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ctrl+Enter to run</span>
              <button className="btn btn-primary btn-sm" onClick={runCode} disabled={running || !code.trim()}>
                {running ? 'Running...' : '▶ Run'}
              </button>
            </div>
            <textarea
              className="console-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'// Type Node.js code here'}
              spellCheck={false}
            />
            <div className="console-examples">
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>EXAMPLES:</span>
              {EXAMPLES.map((ex, i) => (
                <button key={i} className="console-example-btn" onClick={() => setCode(ex.code)}>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className="console-output-panel">
            <div className="console-toolbar">
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Output</span>
              {output && (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {output.executionTime}ms
                  {output.error && <span style={{ color: '#ef4444' }}> &bull; Error</span>}
                </span>
              )}
            </div>
            <pre className={`console-output ${output?.error ? 'console-output-error' : ''}`}>
              {output ? output.output : ''}
            </pre>
          </div>
        </div>

        {history.length > 0 && (
          <div className="console-history">
            <div className="console-toolbar" style={{ padding: '12px 16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>History</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setHistory([])}>Clear</button>
            </div>
            {history.map((h, i) => (
              <div key={i} className="console-history-item" onClick={() => { setCode(h.code); setOutput({ output: h.output, error: h.error, executionTime: h.executionTime }); }}>
                <div className="console-history-code">{h.code.split('\n')[0].slice(0, 80)}</div>
                <div className="console-history-meta">
                  <span className={`console-history-status ${h.error ? 'err' : 'ok'}`}>{h.error ? 'Error' : 'OK'}</span>
                  <span>{h.executionTime}ms</span>
                  <span>{h.time.toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
