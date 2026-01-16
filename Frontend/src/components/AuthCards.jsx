export default function AuthCards() {
  return (
    <section className="auth">
      <div className="auth-card">
        <h3>Login</h3>
        <input placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button className="btn-primary">Log in</button>
      </div>

      <div className="auth-card">
        <h3>Sign Up</h3>
        <input placeholder="Name" />
        <input placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button className="btn-primary">Sign up</button>
      </div>
    </section>
  );
}
