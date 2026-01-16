export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Left */}
        <div className="footer-brand">
          <h3>GYANAI</h3>
          <p>
            AI-powered conversational platform designed for
            intelligent, secure, and seamless interactions.
          </p>
        </div>

        {/* Middle */}
        <div className="footer-links">
          <h4>Product</h4>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>

        {/* Right */}
        <div className="footer-links">
          <h4>Connect</h4>
          <a href="#">GitHub</a>
          <a href="#">LinkedIn</a>
          <a href="#">Contact</a>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} GYANAI. All rights reserved.
      </div>
    </footer>
  );
}
