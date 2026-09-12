"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Doador.module.css";
import {
  trackDoadorLoginError,
  trackDoadorLoginSubmit,
  trackDoadorLoginSuccess,
  trackDoadorPortalView,
} from "@/lib/analytics/events";

/** Classifica a falha de login sem propagar a mensagem da API (evita vazar PII). */
function classificarErroLogin(err: unknown): string {
  return err instanceof TypeError ? "rede" : "api";
}

export default function LoginDoador() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackDoadorPortalView("home");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    trackDoadorLoginSubmit();

    try {
      const res = await fetch("/api/doador/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf_cnpj: cpf.replace(/\D/g, "") }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao solicitar link.");
      }

      trackDoadorLoginSuccess();
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
      trackDoadorLoginError(classificarErroLogin(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.loginWrap}>
          <h2 className={styles.loginTitle}>Portal do Doador</h2>
          <p className={styles.loginDesc}>
            Informe seu CPF ou CNPJ para receber um link de acesso seguro no seu WhatsApp.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <input
                type="text"
                placeholder="CPF ou CNPJ"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
              />
            </div>
            <button className={styles.btn} type="submit" disabled={loading || !cpf}>
              {loading ? "Enviando..." : "Receber link mágico"}
            </button>
          </form>

          {message && <div className={styles.alertSuccess}>{message}</div>}
          {error && <div className={styles.alertError}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
