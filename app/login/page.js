"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(false);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 mt-20 space-y-4">
      <h1 className="text-xl font-bold text-center">Générateur DPS</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          className="border rounded p-2 w-full"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded w-full font-semibold"
        >
          Se connecter
        </button>
        {error && (
          <p className="text-red-600 text-sm text-center">
            Mot de passe incorrect
          </p>
        )}
      </form>
    </main>
  );
}