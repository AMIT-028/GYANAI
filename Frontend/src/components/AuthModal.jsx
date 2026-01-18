import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function AuthModal({ type, onClose }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const url =
        type === "login"
          ? `${API_BASE}/api/auth/login`
          : `${API_BASE}/api/auth/register`;

      const payload =
        type === "login"
          ? { email, password }
          : { name: "User", email, password };

      const res = await axios.post(url, payload);

      if (!res.data.token) {
        alert("Authentication failed");
        return;
      }

      localStorage.setItem("token", res.data.token);
      onClose();
      window.location.href = "/chat";


    } catch (err) {
      alert(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{type === "login" ? "Login" : "Sign Up"}</h3>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="auth-footer span"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : type === "login"
            ? "Log in"
            : "Sign up"}
        </button>
      </div>
    </div>
  );
}
