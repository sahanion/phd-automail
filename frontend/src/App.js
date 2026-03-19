import { useState, useEffect } from "react";
import Login from "./components/Login";
import ProfessorForm from "./components/ProfessorForm";
import EmailGenerator from "./components/EmailGenerator";
import MailLogs from "./components/MailLogs";

function App() {
  // 🔐 Correct pattern
  const correctPattern = [1, 5, 9, 13, 16];

  // 🔐 Main states
  const [clicked, setClicked] = useState([]);
  const [message, setMessage] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // 📝 Professor data
  const [profData, setProfData] = useState(null);

  // 📊 Logs view
  const [viewLogs, setViewLogs] = useState(false);

  // 🚫 Attempt tracking
  const [gridAttempts, setGridAttempts] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // ⛔ Lock system
  const LOCK_DURATION = 30;
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // ⏳ Countdown timer
  useEffect(() => {
    let timer;

    if (isLocked && lockTimer > 0) {
      timer = setInterval(() => {
        setLockTimer((prev) => prev - 1);
      }, 1000);
    }

    if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
      setGridAttempts(0);
      setLoginAttempts(0);
      setClicked([]);
      setMessage("");
    }

    return () => clearInterval(timer);
  }, [isLocked, lockTimer]);

  // 🔒 Trigger lock
  const triggerLock = () => {
    setIsLocked(true);
    setLockTimer(LOCK_DURATION);
    setClicked([]);
    setMessage("");
  };

  // 🔳 Grid logic
  const handleClick = (index) => {
    if (isLocked) return;
    if (clicked.includes(index)) return;

    const newClicked = [...clicked, index];
    setClicked(newClicked);

    const currentStep = newClicked.length - 1;

    if (newClicked[currentStep] !== correctPattern[currentStep]) {
      const attempts = gridAttempts + 1;
      setGridAttempts(attempts);

      setMessage(`Wrong pattern! (${attempts}/5)`);

      setTimeout(() => {
        setClicked([]);
        setMessage("");
      }, 800);

      if (attempts >= 5) {
        triggerLock();
      }

      return;
    }

    if (newClicked.length === correctPattern.length) {
      setMessage("Unlocked ✅");

      setTimeout(() => {
        setIsUnlocked(true);
      }, 800);
    }
  };

  // 🔐 Login handlers
  const handleLoginSuccess = () => {
    setLoggedIn(true);
  };

  const handleLoginFailure = () => {
    const attempts = loginAttempts + 1;
    setLoginAttempts(attempts);

    if (attempts >= 5) {
      triggerLock();
    }
  };

  // 🔒 LOCK SCREEN
  if (isLocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-red-500">
        <h1 className="text-2xl mb-4">System Locked</h1>
        <p>Too many failed attempts</p>
        <p className="mt-2 text-lg">
          Try again in {lockTimer} seconds
        </p>
      </div>
    );
  }

  // 📊 Mail Logs Page (VERY IMPORTANT: placed before others)
  if (viewLogs) {
    return (
      <div>
        <div className="flex justify-between p-4 bg-gray-900 text-white">
          <h2 className="text-lg">Mail Logs</h2>
          <button
            onClick={() => setViewLogs(false)}
            className="bg-red-500 px-3 py-1 rounded"
          >
            Back
          </button>
        </div>

        <MailLogs />
      </div>
    );
  }

  // 🤖 Email Generation Page
  if (profData) {
    return <EmailGenerator profData={profData} />;
  }

  // 📝 Professor Form + Logs Button
  if (loggedIn) {
    return (
      <div>
        <div className="flex justify-end p-4 bg-gray-900">
          <button
            onClick={() => setViewLogs(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Mail Logs
          </button>
        </div>

        <ProfessorForm
          onProceed={(data) => {
            setProfData(data);
          }}
        />
      </div>
    );
  }

  // 🔐 Login Page
  if (isUnlocked) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onLoginFailure={handleLoginFailure}
      />
    );
  }

  // 🔳 Grid UI
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Unlock System</h1>

      <p className="text-sm text-gray-400 mb-2">
        Attempts: {gridAttempts}/5
      </p>

      <div className="grid grid-cols-4 gap-4">
        {[...Array(16)].map((_, i) => {
          const index = i + 1;
          const isActive = clicked.includes(index);

          return (
            <div
              key={index}
              onClick={() => handleClick(index)}
              className={`w-16 h-16 cursor-pointer flex items-center justify-center rounded-lg border 
                ${
                  isActive
                    ? "bg-green-500"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
            >
              {index}
            </div>
          );
        })}
      </div>

      <p className="mt-4">{message}</p>
    </div>
  );
}

export default App;