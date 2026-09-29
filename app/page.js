"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const styles = {
  main: { maxWidth: 480, margin: "0 auto", padding: 20 },
  field: { display: "block", marginBottom: 16 },
  label: { display: "block", marginBottom: 6, fontWeight: 600 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    fontSize: 18,
    border: "1px solid #bbb",
    borderRadius: 8,
  },
  btn: {
    padding: "14px 18px",
    fontSize: 18,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  primary: { background: "#e91e8c", color: "#fff" },
  danger: { background: "#d32f2f", color: "#fff" },
  neutral: { background: "#e0e0e0", color: "#222" },
  warn: {
    background: "#fdecea",
    border: "3px solid #d32f2f",
    borderRadius: 12,
    padding: 18,
    marginTop: 24,
    fontSize: 20,
  },
  error: { color: "#d32f2f", marginTop: 12 },
  info: { color: "#555", marginTop: 12 },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 10,
  },
  dialog: {
    background: "#fff",
    borderTop: "8px solid #d32f2f",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    fontSize: 20,
  },
};

function minutesSince(iso) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export default function GenerateQrPage() {
  const [tableNumber, setTableNumber] = useState("");
  const [adultCount, setAdultCount] = useState("");
  const [childCount, setChildCount] = useState("0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [existing, setExisting] = useState(null); // session เก่าที่ยังเปิดอยู่
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null); // { session, url }
  const [copied, setCopied] = useState(false);

  function resetMessages() {
    setError("");
    setInfo("");
  }

  function onTableChange(value) {
    setTableNumber(value);
    // เปลี่ยนโต๊ะแล้ว ข้อมูลเตือนเดิมใช้ไม่ได้
    setExisting(null);
    setShowConfirm(false);
    resetMessages();
  }

  async function handleOpenTable(e) {
    e.preventDefault();
    resetMessages();
    setResult(null);

    const table = parseInt(tableNumber, 10);
    const adults = parseInt(adultCount, 10);
    const children = parseInt(childCount || "0", 10);

    if (!Number.isInteger(table) || table <= 0) {
      setError("กรุณากรอกเลขโต๊ะให้ถูกต้อง");
      return;
    }
    if (!Number.isInteger(adults) || adults < 0 || !Number.isInteger(children) || children < 0) {
      setError("จำนวนผู้ใหญ่/เด็กต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }
    if (adults + children === 0) {
      setError("ต้องมีลูกค้าอย่างน้อย 1 คน");
      return;
    }

    setLoading(true);
    try {
      // 1) เช็คว่าโต๊ะนี้มี session ที่ยังเปิดอยู่หรือไม่
      const { data: openSession, error: checkErr } = await supabase
        .from("sessions")
        .select("id, adult_count, child_count, created_at")
        .eq("table_number", table)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (openSession) {
        setExisting({ ...openSession, table_number: table });
        return;
      }

      // 2) ไม่มี -> สร้าง session ใหม่
      const { data: created, error: insertErr } = await supabase
        .from("sessions")
        .insert({
          table_number: table,
          adult_count: adults,
          child_count: children,
          status: "open",
        })
        .select("id, table_number, adult_count, child_count, created_at")
        .single();

      if (insertErr) throw insertErr;

      setExisting(null);
      setResult({
        session: created,
        url: `${window.location.origin}/order/${created.table_number}`,
      });
    } catch (err) {
      setError("เกิดข้อผิดพลาด: " + (err?.message || "ไม่ทราบสาเหตุ"));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmClose() {
    if (!existing) return;
    resetMessages();
    setLoading(true);
    try {
      // update เฉพาะแถวนี้ และเฉพาะที่ยังเป็น open อยู่
      const { data, error: updErr } = await supabase
        .from("sessions")
        .update({ status: "closed" })
        .eq("id", existing.id)
        .eq("status", "open")
        .select("id");

      if (updErr) throw updErr;

      if (!data || data.length === 0) {
        setInfo("โต๊ะเดิมถูกปิดไปแล้ว กด \"เปิดโต๊ะ\" ได้เลย");
      } else {
        setInfo("ปิดโต๊ะเดิมเรียบร้อย กด \"เปิดโต๊ะ\" เพื่อเปิดใหม่");
      }
      setShowConfirm(false);
      setExisting(null);
    } catch (err) {
      setError("ปิดโต๊ะเดิมไม่สำเร็จ: " + (err?.message || "ไม่ทราบสาเหตุ"));
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
    } catch (err) {
      // fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ clipboard API
      const ta = document.createElement("textarea");
      ta.value = result.url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleNewTable() {
    setResult(null);
    setCopied(false);
    setTableNumber("");
    setAdultCount("");
    setChildCount("0");
    resetMessages();
  }

  if (result) {
    const s = result.session;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result.url)}`;
    return (
      <main style={{ ...styles.main, textAlign: "center" }}>
        <h1>เปิดโต๊ะสำเร็จ ✅</h1>
        <img
          src={qrSrc}
          alt={`QR Code โต๊ะ ${s.table_number}`}
          width={300}
          height={300}
          style={{ maxWidth: "100%", height: "auto", border: "1px solid #ddd", borderRadius: 8 }}
        />
        <p style={{ fontSize: 24, fontWeight: 700, margin: "16px 0 8px" }}>
          โต๊ะ {s.table_number} · ผู้ใหญ่ {s.adult_count} · เด็ก {s.child_count}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18, wordBreak: "break-all" }}>{result.url}</span>
          <button
            type="button"
            onClick={handleCopy}
            style={{ ...styles.btn, ...styles.neutral, padding: "8px 12px", fontSize: 15 }}
          >
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleNewTable}
          style={{ ...styles.btn, ...styles.primary, marginTop: 24 }}
        >
          เปิดโต๊ะอื่น
        </button>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <h1>เปิดโต๊ะ</h1>

      <form onSubmit={handleOpenTable}>
        <label style={styles.field}>
          <span style={styles.label}>เลขโต๊ะ</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={tableNumber}
            onChange={(e) => onTableChange(e.target.value)}
            style={styles.input}
            required
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>จำนวนผู้ใหญ่</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={adultCount}
            onChange={(e) => setAdultCount(e.target.value)}
            style={styles.input}
            required
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>จำนวนเด็ก</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={childCount}
            onChange={(e) => setChildCount(e.target.value)}
            style={styles.input}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.btn, ...styles.primary, width: "100%", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "กำลังดำเนินการ..." : "เปิดโต๊ะ"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}
      {info && <p style={styles.info}>{info}</p>}

      {existing && (
        <div style={styles.warn} role="alert">
          <p style={{ marginTop: 0, fontWeight: 700, color: "#b71c1c" }}>
            ⚠️ โต๊ะนี้มีลูกค้าอยู่ระหว่างทานอาหาร กรุณาปิดออเดอร์เดิมก่อน
          </p>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            style={{ ...styles.btn, ...styles.danger }}
          >
            ปิดออเดอร์เดิม
          </button>
        </div>
      )}

      {existing && showConfirm && (
        <div style={styles.overlay}>
          <div style={styles.dialog} role="dialog" aria-modal="true">
            <h2 style={{ marginTop: 0 }}>ยืนยันปิดโต๊ะเดิม</h2>
            <p>โต๊ะ {existing.table_number}</p>
            <p>
              ผู้ใหญ่ {existing.adult_count} · เด็ก {existing.child_count}
            </p>
            <p>เปิดมาแล้ว {minutesSince(existing.created_at)} นาที</p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                style={{ ...styles.btn, ...styles.neutral, flex: 1 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={loading}
                style={{ ...styles.btn, ...styles.danger, flex: 1, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "กำลังปิด..." : "ยืนยันปิดโต๊ะเดิม"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
