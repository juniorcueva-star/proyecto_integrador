import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { registerRequest } from "../api/auth";
import { userHighlights } from "../data/mockData";
import { persistAuthSession } from "../utils/authStorage";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const data = await registerRequest(form);
      persistAuthSession(data);
      setStatus({ type: "success", message: "Cuenta creada correctamente." });
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
            <p className="section-kicker section-kicker-light">Crea tu cuenta</p>
            <h1>Empieza a vender, comprar e intercambiar con estilo</h1>
            <p>
              Registrate para publicar tus prendas, mostrar tus metodos de pago y
              construir reputacion en la comunidad.
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
            <h2>Registro</h2>
            <p>Tu cuenta se crea como usuario y luego podras empezar a publicar.</p>
          </div>

          <form className="auth-form auth-form-grid" onSubmit={handleSubmit}>
            <label>
              Nombre completo
              <input
                type="text"
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nombre: event.target.value }))
                }
              />
            </label>
            <label>
              Celular
              <input
                type="tel"
                placeholder="999999999"
                value={form.telefono}
                onChange={(event) =>
                  setForm((current) => ({ ...current, telefono: event.target.value }))
                }
              />
            </label>
            <label className="full-span">
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
            <label className="full-span">
              Contrasena
              <input
                type="password"
                placeholder="Crea una contrasena segura"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            {status.message ? (
              <div className={`form-message form-message-${status.type} full-span`}>
                {status.message}
              </div>
            ) : null}
            <button type="submit" className="button-primary auth-submit full-span" disabled={isSubmitting}>
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="auth-meta">
            <span>¿Ya tienes cuenta?</span>
            <Link to="/login">Entrar</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;
