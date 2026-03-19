import { useState } from "react";

function ProfessorForm({ onProceed }) {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !university || !email) {
      alert("Please fill all fields");
      return;
    }

    onProceed({ name, university, email });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg w-96 shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Professor Details
        </h2>

        <input
          type="text"
          placeholder="Professor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-700 outline-none"
        />

        <input
          type="text"
          placeholder="University"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-700 outline-none"
        />

        <input
          type="email"
          placeholder="Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-gray-700 outline-none"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 py-2 rounded hover:bg-blue-600"
        >
          Proceed
        </button>
      </form>
    </div>
  );
}

export default ProfessorForm;