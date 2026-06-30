import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest } from "../api/auth";
import { steps } from "../data/staticData";
import { persistAuthSession } from "../utils/authStorage";
import { keepDigits, keepLettersAndSpaces } from "../utils/inputSanitizers";

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

  function validateRegisterForm() {
    const normalizedName = form.nombre.trim().replace(/\s+/g, " ");

    if (!/^[\p{L}]+(?:\s+[\p{L}]+)*$/u.test(normalizedName)) {
      return "El nombre solo puede contener letras y espacios. No uses numeros, guiones ni caracteres especiales.";
    }

    if (!/^9\d{8}$/.test(form.telefono)) {
      return "El celular debe empezar con 9 y tener exactamente 9 digitos.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const validationMessage = validateRegisterForm();
    if (validationMessage) {
      setStatus({ type: "error", message: validationMessage });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerRequest({
        ...form,
        nombre: form.nombre.trim().replace(/\s+/g, " "),
      });
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
            <p className="section-kicker section-kicker-light">Como funciona</p>
            <h1>Publica, conecta y da nueva vida a tus prendas</h1>
            <p>
              Crea tu cuenta para acceder al dashboard, publicar prendas y
              gestionar pagos, reclamos y recomendaciones IA.
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
                  setForm((current) => ({
                    ...current,
                    nombre: keepLettersAndSpaces(event.target.value),
                  }))
                }
                pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,60}"
                title="Solo letras y espacios. No uses numeros, guiones ni caracteres especiales."
              />
            </label>
            <label>
              Celular
              <input
                type="tel"
                inputMode="numeric"
                maxLength="9"
                placeholder="999999999"
                value={form.telefono}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    telefono: keepDigits(event.target.value, 9),
                  }))
                }
                pattern="9[0-9]{8}"
                title="Debe empezar con 9 y tener exactamente 9 digitos."
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
            <span>Ya tienes cuenta?</span>
            <Link to="/login">Entrar</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;
