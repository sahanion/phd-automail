import { useEffect, useState } from "react";

function MailLogs() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const response = await fetch("https://phd-automail-production.up.railway.app/logs");
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Error fetching logs");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-2xl mb-4">Mail Logs</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">University</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Attempts</th>
              <th className="p-2 border">IP</th>
              <th className="p-2 border">Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, index) => (
              <tr key={index} className="text-center">
                <td className="p-2 border">{log.professor_name}</td>
                <td className="p-2 border">{log.university}</td>
                <td className="p-2 border">{log.email}</td>
                <td className="p-2 border">{log.attempts}</td>
                <td className="p-2 border">{log.ip}</td>
                <td className="p-2 border">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MailLogs;