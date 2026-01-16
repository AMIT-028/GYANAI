import about from  "../assets/About.png";
export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Welcome to <br /> GYANAI</h1>
        <p>
          AI-powered chat platform inspired by ChatGPT
          for interactive and intelligent conversations.
        </p>
        <button className="btn-primary">Get Started</button>
      </div>

      <div className="hero-mock">
        <img src={about} alt="" />
      </div>
    </section>
  );
}
