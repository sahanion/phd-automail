import { useEffect, useState } from "react";

function EmailGenerator({ profData }) {
  // 🔄 Email generation states
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  // 📧 Sending states
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); 
  // null | "success" | "error"

  // 🤖 Generate email
  const generateEmail = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://phd-automail-production.up.railway.app/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profData),
      });

      const data = await response.json();

      if (data.success) {
        setSubject(data.subject);
        setBody(data.body);
      } else {
        setError("Failed to generate email");
      }
    } catch (err) {
      setError("Server error");
    }

    setLoading(false);
  };

  // 📧 Send email
  const handleSend = async () => {
    setSending(true);

    try {
      const response = await fetch("https://phd-automail-production.up.railway.app/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: profData.email,
          subject,
          body,
          name: profData.name,
          university: profData.university,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSendStatus("success");
      } else {
        setSendStatus("error");
      }
    } catch (err) {
      setSendStatus("error");
    }

    setSending(false);
  };

  // 🔄 On load
  useEffect(() => {
    generateEmail();
  }, []);

  // 🔄 Rewrite
  const handleRewrite = () => {
    generateEmail();
  };

  // 🎉 FULL SCREEN RESULT UI
  if (sendStatus) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        
        {/* ICON */}
        <div className="text-8xl mb-6 animate-bounce">
          {sendStatus === "success" ? "✅" : "❌"}
        </div>

        {/* TEXT */}
        <h1 className="text-2xl mb-6">
          {sendStatus === "success"
            ? "Email Sent Successfully!"
            : "Failed to Send Email"}
        </h1>

        {/* HOME BUTTON */}
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Go Home
        </button>
      </div>
    );
  }

  // ⏳ Loading UI
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p>Work in progress...</p>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h2 className="text-xl mb-4">Generated Email</h2>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="bg-gray-800 p-4 rounded w-full max-w-xl">
        <p><strong>Subject:</strong> {subject}</p>

        <p className="mt-4 text-sm whitespace-pre-line">
          {body}
        </p>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-green-500 px-4 py-2 rounded disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>

        <button
          onClick={handleRewrite}
          className="bg-yellow-500 px-4 py-2 rounded"
        >
          Rewrite
        </button>
      </div>
    </div>
  );
}

export default EmailGenerator;