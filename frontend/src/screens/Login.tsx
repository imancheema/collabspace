import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import LoginNavbar from "../components/LoginNavbar";

type LoginProps = {
  onLogin: () => void;
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);

      const resp = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        // ignore
      }

      if (!resp.ok || data?.ok === false) {
        const msg =
          data?.error ||
          (resp.status === 401
            ? "Invalid email or password."
            : "Unable to sign in. Please try again.");
        setError(msg);
        return;
      }

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

      onLogin();

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoginNavbar />
      <div className="login__container">
        <div className="login__card" role="region" aria-labelledby="loginTitle">
          <header className="login__header">
            <h1 id="loginTitle" className="login__title">
              Sign in to your account
            </h1>
          </header>

          <form onSubmit={handleSubmit} className="login__form" noValidate>
            {error && (
              <div className="login__error" role="alert">
                {error}
              </div>
            )}

            <div className="login__group">
              <label htmlFor="email" className="login__label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="login__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error && !email ? "true" : "false"}
                required
              />
            </div>

            <div className="login__group">
              <label htmlFor="password" className="login__label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="login__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error && !password ? "true" : "false"}
                required
              />
            </div>

            <button
              type="submit"
              className="login__button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <footer className="login__footer">
            <span>Don’t have an account? </span>
            <a className="login__link" href="/register">
              Sign up
            </a>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Login;
