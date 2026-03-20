import { useState } from "react";

function Login({ onLoginSuccess, onLoginFailure }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id || !password) {
      setError("Please enter ID and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://phd-automail-production.up.railway.app/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (data.success) {
        setLoading(false);
        onLoginSuccess(); // ✅ go to dashboard
      } else {
        setLoading(false);
        setError("Invalid credentials");
        onLoginFailure(); // 🔥 track failed attempts
      }
    } catch (err) {
      setLoading(false);
      setError("Cannot connect to server");
      onLoginFailure(); // 🔥 count as failed attempt
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg w-80 shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        <input
          type="text"
          placeholder="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-700 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-700 outline-none"
        />

        {error && (
          <p className="text-red-400 text-sm mb-2 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;