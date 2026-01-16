export default function Navbar({ onLogin, onSignup }) {
  return (
    <nav className="nav">
      <div className="logo">GYANAI</div>

      <div className="nav-right">
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
        </div>

        <div className="nav-actions">
          <button className="btn-outline" onClick={onLogin}>Login</button>
          <button className="btn-primary" onClick={onSignup}>Sign Up</button>
        </div>
      </div>
    </nav>
  );
}
