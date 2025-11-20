import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import LoginNavbar from "../components/LoginNavbar";

type RegisterProps = {
  onRegister: () => void;
};

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);

      const resp = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        // ignore non-JSON
      }

      if (!resp.ok || data?.ok === false) {
        const msg =
          data?.error ||
          (resp.status === 409
            ? "An account with this email already exists."
            : "Unable to sign up. Please try again.");
        setError(msg);
        return;
      }

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

      onRegister();

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
        <div
          className="login__card"
          role="region"
          aria-labelledby="signupTitle"
        >
          <header className="login__header">
            <h1 id="signupTitle" className="login__title">
              Create a new account
            </h1>
          </header>

          <form onSubmit={handleSubmit} className="login__form" noValidate>
            {error && (
              <div className="login__error" role="alert">
                {error}
              </div>
            )}

            <div className="login__group">
              <label htmlFor="name" className="login__label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="login__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                autoComplete="new-password"
                className="login__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="login__button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <footer className="login__footer">
            <span>Already have an account? </span>
            <a className="login__link" href="/login">
              Sign in
            </a>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Register;
