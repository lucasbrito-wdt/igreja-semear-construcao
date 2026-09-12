"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../Doador.module.css";
import { trackDoadorPortalView } from "@/lib/analytics/events";

function AuthLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Token não encontrado na URL.");
      return;
    }

    fetch("/api/doador/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json().then((data) => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status === 200 && data.access_token) {
          localStorage.setItem("doador_token", data.access_token);
          router.push("/doador/painel");
        } else {
          setError(data.message || "Falha na autenticação.");
        }
      })
      .catch((err) => {
        setError("Erro ao autenticar. Tente novamente.");
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.alertError}>{error}</div>
        <button className={styles.btn} style={{ marginTop: 20 }} onClick={() => router.push("/doador")}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.loadingWrap}>
      <div className={styles.dots}>
        <i />
        <i />
        <i />
      </div>
      <h2 className={styles.loadingTitle}>Validando seu acesso...</h2>
    </div>
  );
}

export default function AuthPage() {
  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackDoadorPortalView("auth");
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <Suspense fallback={<div className={styles.loadingTitle}>Carregando...</div>}>
          <AuthLogic />
        </Suspense>
      </div>
    </div>
  );
}
