import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { loginRequest } from "../api/auth";
import { userHighlights } from "../data/mockData";
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

  return (
    <section className="auth-page">
      <div className="auth-card auth-card-split">
        <div className="auth-side auth-side-dark">
          <div className="auth-copy auth-copy-light">
            <p className="section-kicker section-kicker-light">Bienvenido otra vez</p>
            <h1>Entra a tu espacio de moda circular</h1>
            <p>
              Gestiona tus prendas, revisa tus mensajes y activa las herramientas
              de Estilo IA desde un solo lugar.
            </p>
          </div>

          <div className="auth-feature-list">
            {userHighlights.map((item) => (
              <article key={item.title} className="auth-feature-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="auth-side auth-side-form">
          <div className="auth-form-head">
            <h2>Iniciar sesion</h2>
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
              Contrasena
              <input
                type="password"
                placeholder="Ingresa tu contrasena"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>

            <div className="auth-inline-note">
              <span>Credenciales seguras con JWT y acceso por roles.</span>
              <a href="#recuperar">¿Olvidaste tu contrasena?</a>
            </div>

            {status.message ? (
              <div className={`form-message form-message-${status.type}`}>
                {status.message}
              </div>
            ) : null}

            <button type="submit" className="button-primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
            </button>
          </form>

          <div className="auth-meta">
            <span>¿Aun no tienes cuenta?</span>
            <Link to="/register">Crear cuenta</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
