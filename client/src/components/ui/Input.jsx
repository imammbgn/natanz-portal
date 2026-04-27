export function Input({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${error ? 'form-input-error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea className={`form-textarea ${error ? 'form-input-error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={`form-select ${error ? 'form-input-error' : ''}`} {...props}>
        {children}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
