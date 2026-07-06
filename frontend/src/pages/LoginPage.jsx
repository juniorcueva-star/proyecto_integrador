import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginRequest, loginWithGoogle } from "../api/auth";
import { steps } from "../data/staticData";
import { persistAuthSession } from "../utils/authStorage";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const data = await loginRequest(form);
      persistAuthSession(data);
      setStatus({ type: "success", message: `Bienvenido, ${data.nombre}.` });
      navigate(data.rol === "ROLE_ADMIN" ? "/admin" : "/user");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const data = await loginWithGoogle();
      persistAuthSession(data);
      setStatus({ type: "success", message: `Bienvenido, ${data.nombre}.` });
      navigate("/user");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card auth-card-split">
        <div className="auth-side auth-side-dark">
          <div className="auth-copy auth-copy-light">
            <p className="section-kicker section-kicker-light">Cómo funciona</p>
            <h1>Gestiona tu moda circular en tres pasos</h1>
            <p>
              Inicia sesión para publicar prendas, administrar tu perfil y usar
              las herramientas de Estilo IA desde tu dashboard.
            </p>
          </div>

          <div className="auth-steps-list">
            {steps.map((item) => (
              <article key={item.number} className="auth-step-card">
                <span>{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="auth-side auth-side-form">
          <div className="auth-form-head">
            <h2>Iniciar sesión</h2>
            <p>Accede como usuario o administrador con tu correo registrado.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Correo
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>

            <div className="auth-inline-note">
              <span>Acceso seguro con Firebase Auth para web y móvil.</span>
            </div>

            {status.message ? (
              <div className={`form-message form-message-${status.type}`}>
                {status.message}
              </div>
            ) : null}

            <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            </button>
            <button
              type="button"
              className="button-secondary auth-submit"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              Continuar con Google
            </button>
          </form>

          <div className="auth-meta">
            <span>¿Aún no tienes cuenta?</span>
            <Link to="/register">Crear cuenta</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
