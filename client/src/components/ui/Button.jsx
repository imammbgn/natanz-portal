export function Button({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {children}
    </button>
  );
}
