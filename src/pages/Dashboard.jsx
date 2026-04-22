import { useEffect, useState } from "react";
import { SignedIn, UserButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [syncStatus, setSyncStatus] = useState("Syncing to database...");
  const [exams, setExams] = useState([]);
  const [dbUser, setDbUser] = useState(null);
  const [pastResults, setPastResults] = useState([]);
  const [rollInput, setRollInput] = useState("");
  const [showRollModal, setShowRollModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  const fetchDbUser = async () => {
    try {
      const resp = await fetch(`https://prepexam-backend.onrender.com/api/users/me?clerk_id=${user.id}`);
      const data = await resp.json();
      if (data.user) {
        setDbUser(data.user);
        if (!data.user.roll_number && data.user.role === 'STUDENT') setShowRollModal(true);
        
        if (data.user.role === 'STUDENT') {
           const historyResp = await fetch(`https://prepexam-backend.onrender.com/api/users/me/results?clerk_id=${user.id}`);
           const historyData = await historyResp.json();
           if(historyData.success) setPastResults(historyData.results);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRoll = async (e) => {
    e.preventDefault();
    if (!rollInput.trim()) return;

    // Strict Format Validation: CS-Sem-Roll (e.g., CS-1-101)
    const rollRegex = /^CS-[1-8]-[0-9]{1,4}$/i;
    if (!rollRegex.test(rollInput)) {
      alert("Invalid Format! Please use: CS-(Semester)-(RollNo)\nExample: CS-1-101");
      return;
    }

    try {
      const resp = await fetch(`https://prepexam-backend.onrender.com/api/users/roll`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerk_id: user.id, roll_number: rollInput.trim().toUpperCase() })
      });
      if (resp.ok) {
        setShowRollModal(false);
        fetchDbUser();
      }
    } catch (err) { alert("Failed to save."); }
  };

  // Fetch Users List explicitly if the user is an Admin
  useEffect(() => {
    if (dbUser?.role === 'ADMIN') {
      const fetchAdminData = async () => {
        try {
          const res = await fetch("https://prepexam-backend.onrender.com/api/users");
          const data = await res.json();
          if (data.success) setUsersList(data.users);

          const statsRes = await fetch("https://prepexam-backend.onrender.com/api/admin/stats");
          const statsData = await statsRes.json();
          if(statsData.success) setAdminStats(statsData.stats);
        } catch (err) {
          console.error("Failed to fetch admin data", err);
        }
      };
      fetchAdminData();
    }
  }, [dbUser]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`https://prepexam-backend.onrender.com/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        const errorData = await res.json();
        alert("Backend Error: " + errorData.error);
      }
    } catch (err) {
      alert("Network Error checking backend server.");
    }
  };

  useEffect(() => {
    // ONLY run if the user object is fully loaded by Clerk
    if (isLoaded && user) {
      const syncUserToDatabase = async () => {
        try {
          const response = await fetch("https://prepexam-backend.onrender.com/api/users/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerk_id: user.id,
              email: user.primaryEmailAddress.emailAddress,
              name: user.fullName || user.firstName || "Unknown User",
            })
          });

          const data = await response.json();
          if (response.ok) {
            setDbUser(data.user);
            if (!data.user.roll_number && data.user.role === 'STUDENT') setShowRollModal(true);
            setSyncStatus(data.message === "User already synced"
              ? "🟢 Database connection active"
              : "🟢 New User Data Synced!");

            // Send Login Email on every login
            emailjs.send(
              "service_32mzb8d",
              "template_c4s2pbh",
              {
                student_name: user.fullName || user.firstName || "Student",
                student_email: user.primaryEmailAddress.emailAddress,
                login_time: new Date().toLocaleString(),
              },
              "uCKcJ-jhu63oWbXTQ"
            ).catch(err => console.warn("EmailJS login error:", err));
              
            if (data.user.role === 'STUDENT') {
               const historyResp = await fetch(`https://prepexam-backend.onrender.com/api/users/me/results?clerk_id=${user.id}`);
               const historyData = await historyResp.json();
               if(historyData.success) setPastResults(historyData.results);
            }
          } else {
            setSyncStatus("🔴 Sync Failed: " + data.error);
          }
        } catch (error) {
          console.error("Database Sync Error:", error);
          setSyncStatus("🔴 Backend server is offline");
        }
      };

      const fetchExams = async () => {
        try {
          const res = await fetch("https://prepexam-backend.onrender.com/api/exams");
          const data = await res.json();
          if (data.success) {
            setExams(data.exams);
          }
        } catch (err) {
          console.error("Failed to load exams", err);
        }
      };

      syncUserToDatabase();
      fetchExams();
    }
  }, [user, isLoaded]);

  // Admin Exam Delete Hook
  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Admin Action: Permanently delete this Exam? All student results and associated records will be destroyed.")) return;
    try {
      const res = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}`, { method: "DELETE" });
      if (res.ok) {
        setExams(exams.filter(e => e.id !== examId));
      } else {
        alert("Failed to delete exam from database.");
      }
    } catch (err) {
      alert("Server Offline.");
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-slate-950 p-6 font-sans transition-colors duration-300">
      <nav className="w-full h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex justify-between items-center px-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
          <h1 onClick={() => navigate("/")} className="text-xl font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer">PrepExam Portal</h1>
          <div className="hidden sm:flex items-center gap-3 bg-gray-50/50 dark:bg-slate-800/50 px-4 py-1.5 rounded-xl border border-gray-100 dark:border-slate-800 transition-all shadow-inner">
             <div className="text-indigo-500 dark:text-indigo-400">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <div className="flex flex-col text-left leading-tight">
               <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-tighter">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
               <span className="text-xs font-black text-gray-800 dark:text-slate-100 font-mono tracking-wide">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700" title={syncStatus}>
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${syncStatus.includes('🟢') ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : syncStatus.includes('🔴') ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-amber-500'}`}></div>
          </div>
          {dbUser?.role === 'STUDENT' && dbUser?.roll_number && (
            <div className="hidden lg:flex flex-col items-end mr-1">
              <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Roll Number</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider">{dbUser.roll_number}</span>
            </div>
          )}
          <SignedIn><UserButton /></SignedIn>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Basic Admin Dashboard Skeleton */}
        <div className="col-span-1 md:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-500 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Hello, {user?.firstName || "Student"} 👋
            </h2>
            <p className="text-gray-500 mt-2">Welcome to your secure portal. Your active authority level is: <strong className="text-indigo-600 uppercase tracking-wider">{dbUser?.role || (syncStatus.includes('🔴') ? "Sync Error" : "Loading...")}</strong></p>
          </div>
          <button onClick={() => navigate("/profile")} className="hidden md:flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-5 py-2.5 rounded-xl transition border border-indigo-100">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             My Profile
          </button>
        </div>

        {/* Global Stats Overview (Admin Only) */}
        {dbUser?.role === 'ADMIN' && adminStats && (
          <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
               <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-1">Total Students</p>
               <h3 className="text-4xl font-black">{adminStats.users}</h3>
            </div>
            <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200">
               <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs mb-1">Exams Configured</p>
               <h3 className="text-4xl font-black">{adminStats.exams}</h3>
            </div>
            <div className="bg-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-200">
               <p className="text-orange-100 font-bold uppercase tracking-widest text-xs mb-1">Global Questions</p>
               <h3 className="text-4xl font-black">{adminStats.questions}</h3>
            </div>
            <div className="bg-pink-500 rounded-3xl p-6 text-white shadow-lg shadow-pink-200">
               <p className="text-pink-100 font-bold uppercase tracking-widest text-xs mb-1">Total Submissions</p>
               <h3 className="text-4xl font-black">{adminStats.submissions}</h3>
            </div>
          </div>
        )}

        {/* Admin Action: Create Exam Card */}
        {dbUser?.role === 'ADMIN' && (
          <div onClick={() => navigate("/admin/create-exam")} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-md cursor-pointer transition">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-1 dark:text-white">Create Exam</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Draft a new objective test.</p>
          </div>
        )}

        {/* Admin/Teacher Action: Central Question Bank Card */}
        {(dbUser?.role === 'ADMIN' || dbUser?.role === 'TEACHER') && (
          <div onClick={() => navigate("/admin/question-bank")} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-md transition cursor-pointer">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-1 dark:text-white">Question Bank Master</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create Subject Folders & Save MCQs.</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:-translate-y-1 transition border-l-4 border-l-red-400">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-1 dark:text-white">Demo Student View</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Test the lockdown exam environment.</p>
          <button onClick={() => navigate("/exam/demo")} className="px-4 py-2 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 font-bold rounded-lg text-sm transition">Take Demo Test</button>
        </div>

      </div>

      {/* NEW: DYNAMIC RECENT EXAMS LIST */}
      <div className="max-w-6xl mx-auto mt-12 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3">Active Exams Library</h2>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <h3 className="text-lg font-bold text-gray-600">No Exams Found</h3>
            <p className="text-gray-400">Click on 'Create Exam' to add your first test.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide border-b border-gray-100 dark:border-slate-800">
                    <th className="p-4 font-semibold rounded-tl-xl">Exam Title</th>
                    <th className="p-4 font-semibold">Duration</th>
                    <th className="p-4 font-semibold">Schedule</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-bold text-gray-800 dark:text-slate-100">{exam.title}</td>
                      <td className="p-4 text-gray-600 dark:text-slate-300 font-medium">{exam.duration_minutes} Mins</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{exam.marks_per_question}</span>
                          <span className="text-red-500 dark:text-red-400 text-[10px] font-bold">-{exam.negative_marks}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-[10px] font-bold uppercase tracking-tighter">
                          <span className="text-emerald-500 dark:text-emerald-400">START: {exam.valid_from ? new Date(exam.valid_from).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'NOW'}</span>
                          <span className="text-red-400 dark:text-red-300">END: {exam.valid_until ? new Date(exam.valid_until).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'FOREVER'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800">{exam.status}</span>
                      </td>
                      <td className="p-4 flex gap-2">
                        {(dbUser?.role === 'ADMIN' || dbUser?.role === 'TEACHER') && (
                          <button onClick={() => navigate(`/admin/exam/${exam.id}`)} className="text-indigo-600 font-bold hover:text-indigo-800 text-sm transition border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50">Manage</button>
                        )}
                        {dbUser?.role === 'STUDENT' && (
                          pastResults.find(r => r.exam_id === exam.id) ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-bold bg-gray-100 text-[10px] uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-lg">Attempted</span>
                              <button onClick={() => navigate(`/exam/${exam.id}/result`)} className="text-indigo-600 font-bold hover:text-indigo-800 text-sm transition border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50">Report</button>
                            </div>
                          ) : (
                            <button onClick={() => navigate(`/exam/${exam.id}`)} className="text-emerald-600 font-bold hover:text-emerald-800 text-sm transition border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50">Attempt</button>
                          )
                        )}
                        {dbUser?.role === 'ADMIN' && (
                          <button onClick={() => handleDeleteExam(exam.id)} className="text-red-500 font-bold hover:text-red-700 text-sm transition border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">{exam.title}</h4>
                    <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-100 dark:border-emerald-800 uppercase">{exam.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase">Validity & Time</p>
                      <p className="text-[10px] font-bold text-gray-700 dark:text-slate-200">{exam.duration_minutes}m • {exam.valid_from ? new Date(exam.valid_from).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Any'} - {exam.valid_until ? new Date(exam.valid_until).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'End'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase">Marking Scheme</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-slate-200">+{exam.marks_per_question} / <span className="text-red-500 dark:text-red-400">-{exam.negative_marks}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(dbUser?.role === 'ADMIN' || dbUser?.role === 'TEACHER') && (
                      <button onClick={() => navigate(`/admin/exam/${exam.id}`)} className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl text-sm border border-indigo-200 dark:border-indigo-800">Manage</button>
                    )}
                    {dbUser?.role === 'STUDENT' && (
                      pastResults.find(r => r.exam_id === exam.id) ? (
                        <div className="flex flex-col w-full gap-2">
                           <button disabled className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 font-bold rounded-xl text-sm border border-gray-200 dark:border-slate-700">Already Attempted</button>
                           <button onClick={() => navigate(`/exam/${exam.id}/result`)} className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl text-sm border border-indigo-200 dark:border-indigo-800">View & Download Report</button>
                        </div>
                      ) : (
                        <button onClick={() => navigate(`/exam/${exam.id}`)} className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20">Attempt Test</button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NEW: STUDENT EXAM HISTORY */}
      {dbUser?.role === 'STUDENT' && pastResults.length > 0 && (
        <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3 mb-6">My Academic Records</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {pastResults.map(res => (
                <div key={res.id} className="border border-gray-100 bg-gray-50 hover:bg-white rounded-2xl p-6 relative overflow-hidden transition group shadow-sm hover:shadow-md">
                   <div className={`absolute top-0 right-0 px-4 py-1 text-[10px] font-black tracking-widest text-white rounded-bl-xl ${res.status === 'PASS' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                     {res.status}
                   </div>
                   <h3 className="font-bold text-gray-800 text-lg mb-1 pr-12 truncate">{res.exams?.title || "Examination"}</h3>
                   <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-wider">{new Date(res.created_at).toLocaleString()}</p>
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Final Score</p>
                       <p className="text-3xl font-black text-indigo-700 leading-none">{res.total_score} <span className="text-sm font-bold text-gray-400">/ {res.exams?.total_marks}</span></p>
                     </div>
                     {res.status === 'PASS' && (
                       <button onClick={() => navigate(`/certificate/${res.exam_id}?score=${res.total_score}&date=${new Date(res.created_at).toLocaleDateString()}`)} className="text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-600 hover:text-white p-2.5 rounded-xl transition shadow-sm" title="Download Passing Certificate">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </button>
                     )}
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* NEW: PLATFORM USERS SECTION (ADMIN ONLY) */}
      {dbUser?.role === 'ADMIN' && (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 border-l-4 border-emerald-500 pl-3">Platform Users & Role Assignment</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide border-b border-gray-100">
                  <th className="p-4 font-semibold rounded-tl-xl">Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Joined Date</th>
                  <th className="p-4 font-semibold rounded-tr-xl">Current Role</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr) => (
                  <tr key={usr.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-800">{usr.name}</td>
                    <td className="p-4 text-gray-600">{usr.email}</td>
                    <td className="p-4 text-gray-500 text-sm">{new Date(usr.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <select
                        value={usr.role}
                        onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                        className={`text-sm font-bold border-2 rounded-lg px-2 py-1 outline-none transition cursor-pointer 
                          ${usr.role === 'ADMIN' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                            usr.role === 'TEACHER' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                              'bg-gray-50 border-gray-200 text-gray-700'}`}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRollModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 w-full h-2 bg-indigo-500 left-0"></div>
            <h3 className="text-2xl font-black text-gray-800 mb-2 mt-2">College Registration</h3>
            <p className="text-gray-500 mb-8 text-sm">Welcome aboard! Please enter your official College Roll Number to activate your student account. This is required to appear on the official Leaderboards.</p>
            <form onSubmit={handleSaveRoll}>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">ROLL / REGISTRATION NUMBER</label>
              <input autoFocus required value={rollInput} onChange={e => setRollInput(e.target.value)} placeholder="e.g. NAND2554849" className="w-full px-5 py-4 mt-2 bg-gray-50 border border-gray-200 rounded-2xl mb-6 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition uppercase tracking-wider" />
              <button type="submit" disabled={!rollInput.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-200">Activate Profile</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
