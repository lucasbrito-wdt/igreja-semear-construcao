"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../Doador.module.css";
import { trackDoadorPortalView } from "@/lib/analytics/events";

export default function PainelDoador() {
  const router = useRouter();
  const [doacoes, setDoacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackDoadorPortalView("painel");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("doador_token");
    if (!token) {
      router.push("/doador");
      return;
    }

    fetch("/api/doador/doacoes", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("doador_token");
          router.push("/doador");
          throw new Error("Sessão expirada.");
        }
        return res.json();
      })
      .then((data) => {
        setDoacoes(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  async function handleCancelar(id: string) {
    if (!confirm("Tem certeza que deseja cancelar esta assinatura mensal?")) return;

    setCancelingId(id);
    const token = localStorage.getItem("doador_token");

    try {
      const res = await fetch(`/api/doador/doacoes/${id}/cancelar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao cancelar.");

      setDoacoes((prev) => prev.map((d) => (d.id === id ? { ...d, status: "CANCELADA" } : d)));
      alert("Assinatura cancelada com sucesso.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelingId(null);
    }
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.box} style={{ textAlign: "center" }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.dashHeader}>
          <h2 className={styles.dashTitle}>Suas doações</h2>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}

        <div className={styles.donationList}>
          {doacoes.length === 0 && !error ? (
            <p style={{ color: "var(--body-c)" }}>Você ainda não possui doações registradas.</p>
          ) : (
            doacoes.map((doacao) => (
              <div key={doacao.id} className={styles.donationCard}>
                <div className={styles.donMeta}>
                  <span className={styles.donId}>#{doacao.id.substring(0, 8)}</span>
                  <span className={styles.donDate}>{formatDate(doacao.created_at)}</span>
                </div>
                <div className={styles.donValWrap}>
                  <span className={styles.donVal}>{formatMoney(doacao.valor)}</span>
                  <span className={styles.donFreq}>{doacao.frequencia}</span>
                </div>
                <div className={styles.donStatusWrap}>
                  <span
                    className={`${styles.badge} ${
                      doacao.status === "PAGO" || doacao.status === "ATIVA"
                        ? styles.badgeOk
                        : doacao.status === "CANCELADA" || doacao.status === "FALHA"
                        ? styles.badgeErr
                        : styles.badgeWarn
                    }`}
                  >
                    {doacao.status}
                  </span>
                </div>
                <div className={styles.donAction}>
                  {doacao.frequencia === "mensal" && doacao.status !== "CANCELADA" && (
                    <button
                      className={styles.btnCancelar}
                      onClick={() => handleCancelar(doacao.id)}
                      disabled={cancelingId === doacao.id}
                    >
                      {cancelingId === doacao.id ? "Cancelando..." : "Cancelar assinatura"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
