import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

export default function ManageExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('QUESTIONS'); // 'QUESTIONS' | 'LEADERBOARD' | 'BANK'
  const [globalBank, setGlobalBank] = useState([]);
  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const [bankFilter, setBankFilter] = useState('ALL');
  
  // Single Question Form State
  const [qForm, setQForm] = useState({
    question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A"
  });

  const fetchDetails = async () => {
    try {
      const resExam = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}`);
      const dataExam = await resExam.json();
      if (dataExam.success) setExam(dataExam.exam);

      const resQues = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}/questions`);
      const dataQues = await resQues.json();
      if (dataQues.success) setQuestions(dataQues.questions);

      const resLeader = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}/leaderboard`);
      const dataLeader = await resLeader.json();
      if (dataLeader.success) setLeaderboard(dataLeader.leaderboard);
      
      const resBank = await fetch(`https://prepexam-backend.onrender.com/api/questions`);
      const dataBank = await resBank.json();
      if (dataBank.success) setGlobalBank(dataBank.questions);

    } catch (err) {
      console.error("Failed fetching exam data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [examId]);

  const handleInputChange = (e) => setQForm({ ...qForm, [e.target.name]: e.target.value });



  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}/questions`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(qForm)
      });
      const data = await resp.json();
      if (data.success) {
        setQForm({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" });
        fetchDetails(); 
      } else {
        alert("Error saving question: " + data.error);
      }
    } catch (error) { alert("Server Offline.");}
  };

  const handleDeleteQuestion = async (qId) => {
    if(!window.confirm("Delete this question permanently?")) return;
    try {
      const resp = await fetch(`https://prepexam-backend.onrender.com/api/questions/${qId}`, { method: "DELETE" });
      if(resp.ok) fetchDetails();
    } catch(err) { alert("Failed to delete."); }
  };

  const handleInjectMockData = async () => {
    if (!window.confirm("Testing Action: Seed Global Bank permanently with 15 advanced B-Tech Core Questions?")) return;
    setLoading(true);
    try {
      // Just hit the seed endpoint directly
      const resp = await fetch("https://prepexam-backend.onrender.com/api/seed/btech");
      if (resp.ok) {
         fetchDetails();
         setActiveTab("BANK");
         alert("Successfully Seeding Global Database! 15 Questions Added.");
      }
    } catch(e) {
      alert("Injection interrupted. Restart your backend server!");
    } finally {
      setLoading(false);
    }
  };

  const toggleBankSelection = (id) => {
    setSelectedBankIds(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]);
  };

  const handleLinkSelected = async () => {
    if (selectedBankIds.length === 0) return alert("Select at least 1 question.");
    setLoading(true);
    try {
      const resp = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}/link-questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_ids: selectedBankIds })
      });
      if(resp.ok) {
        setSelectedBankIds([]);
        fetchDetails();
        setActiveTab("QUESTIONS");
      }
    } catch(err) {
      alert("Failed to push questions to Exam");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Exam Data...</div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">Exam Not Found</div>;

  return (
    <div className="min-h-screen bg-[#f4f6fa] p-4 font-sans pb-20">
      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto h-16 bg-white rounded-xl shadow-sm flex items-center justify-between px-6 mb-8 border border-gray-100">
        <h1 className="text-xl font-bold text-indigo-700">Admin Control Center</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate("/dashboard")} className="text-sm font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">Exit to Dashboard</button>
          <UserButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* STATS HEADER */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 grid md:grid-cols-4 gap-6 items-center">
             <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-extrabold text-gray-900">{exam.title}</h2>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 font-bold rounded-lg text-xs tracking-wide border border-indigo-100">ACTIVE</span>
                </div>
                <p className="text-gray-500 font-medium text-sm">{exam.duration_minutes} Mins • {exam.total_marks} Marks • +{exam.marks_per_question} / -{exam.negative_marks} grading</p>
             </div>
             
             <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Questions</p>
                  <p className="text-2xl font-black text-gray-800">{questions.length}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
             </div>

             <div className="bg-emerald-50 p-4 rounded-2xl flex items-center justify-between border border-emerald-100">
                <div>
                  <p className="text-xs font-bold text-emerald-600/70 uppercase">Students Attempted</p>
                  <p className="text-2xl font-black text-emerald-700">{leaderboard.length}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
             </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-gray-200">
           <button onClick={() => setActiveTab('QUESTIONS')} className={`px-6 py-3 font-bold text-sm transition border-b-2 ${activeTab==='QUESTIONS' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Exam Content</button>
           <button onClick={() => setActiveTab('BANK')} className={`px-6 py-3 font-bold text-sm transition border-b-2 ${activeTab==='BANK' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Global Question Bank</button>
           <button onClick={() => setActiveTab('LEADERBOARD')} className={`px-6 py-3 font-bold text-sm transition border-b-2 ${activeTab==='LEADERBOARD' ? 'text-emerald-600 border-emerald-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Live Leaderboard / Results</button>
        </div>

        {/* TAB 1: QUESTIONS */}
        {activeTab === 'QUESTIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold text-gray-800 mb-6 border-l-4 border-indigo-500 pl-3">Questions Uploaded ({questions.length})</h3>
               {questions.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-400 font-semibold mb-1">Bank is Empty</p>
                    <p className="text-gray-400 text-sm">Add questions using the right panel.</p>
                  </div>
               ) : (
                  <div className="space-y-6">
                    {questions.map((q, i) => (
                      <div key={q.id || i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                         <div className="absolute top-4 right-4 flex gap-2">
                           <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg text-xs select-none">Ans: {q.correct_option}</span>
                           <button onClick={(e) => { e.preventDefault(); handleDeleteQuestion(q.id); }} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition shadow-sm border border-red-100 opacity-0 group-hover:opacity-100">Delete</button>
                           <button onClick={() => alert("Edit modal UI coming in next phase")} className="bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition shadow-sm border border-blue-100 opacity-0 group-hover:opacity-100">Edit</button>
                         </div>
                         <h4 className="font-bold text-gray-800 mb-4 pr-32"><span className="text-indigo-500 mr-2">Q{i+1}.</span> {q.question_text}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                           <div className={`p-3 rounded-lg ${q.correct_option === 'A' ? 'bg-emerald-50 border border-emerald-200 shadow-[inset_0_0_0_1px_#a7f3d0]' : 'bg-white border border-gray-200'}`}><strong className="text-gray-400 mr-2">A.</strong> {q.option_a}</div>
                           <div className={`p-3 rounded-lg ${q.correct_option === 'B' ? 'bg-emerald-50 border border-emerald-200 shadow-[inset_0_0_0_1px_#a7f3d0]' : 'bg-white border border-gray-200'}`}><strong className="text-gray-400 mr-2">B.</strong> {q.option_b}</div>
                           <div className={`p-3 rounded-lg ${q.correct_option === 'C' ? 'bg-emerald-50 border border-emerald-200 shadow-[inset_0_0_0_1px_#a7f3d0]' : 'bg-white border border-gray-200'}`}><strong className="text-gray-400 mr-2">C.</strong> {q.option_c}</div>
                           <div className={`p-3 rounded-lg ${q.correct_option === 'D' ? 'bg-emerald-50 border border-emerald-200 shadow-[inset_0_0_0_1px_#a7f3d0]' : 'bg-white border border-gray-200'}`}><strong className="text-gray-400 mr-2">D.</strong> {q.option_d}</div>
                         </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>

            <div className="lg:col-span-1">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-8">
                 <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg> Add New MCQ
                 </h3>
                 <form onSubmit={handleAddQuestion} className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Question Text</label>
                      <textarea required name="question_text" value={qForm.question_text} onChange={handleInputChange} rows={3} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition resize-none"></textarea>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div><label className="text-xs font-bold text-gray-400">Option A</label><input required name="option_a" value={qForm.option_a} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400" /></div>
                     <div><label className="text-xs font-bold text-gray-400">Option B</label><input required name="option_b" value={qForm.option_b} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400" /></div>
                     <div><label className="text-xs font-bold text-gray-400">Option C</label><input required name="option_c" value={qForm.option_c} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400" /></div>
                     <div><label className="text-xs font-bold text-gray-400">Option D</label><input required name="option_d" value={qForm.option_d} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400" /></div>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Correct Answer</label>
                      <select name="correct_option" value={qForm.correct_option} onChange={handleInputChange} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-emerald-600 focus:outline-none focus:border-emerald-400 cursor-pointer">
                        <option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option>
                      </select>
                   </div>
                   <button type="submit" className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-lg">Upload to DataBank</button>
                 </form>

                 <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide uppercase">Developer Tools</p>
                    <button onClick={handleInjectMockData} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition border border-gray-200 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                      Auto-Inject Mock MCQs
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center text-balance">Use this to bypass manual typing during presentations and instantly populate the test.</p>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL QUESTION BANK */}
        {activeTab === 'BANK' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">Central Question Bank ({globalBank.length})</h3>
                {selectedBankIds.length > 0 && (
                  <button onClick={handleLinkSelected} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition">
                    Push {selectedBankIds.length} Checked Questions to Exam
                  </button>
                )}
             </div>

             {globalBank.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-50 border border-gray-100 rounded-xl inline-flex shadow-inner">
                 <button onClick={() => setBankFilter('ALL')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${bankFilter === 'ALL' ? 'bg-white shadow text-blue-700 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>All</button>
                 {[...new Set(globalBank.map(q => q.subject))].map(sub => (
                    <button key={sub} onClick={() => setBankFilter(sub)} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${bankFilter === sub ? 'bg-white shadow text-blue-700 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>{sub}</button>
                 ))}
               </div>
             )}
             
             {globalBank.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-gray-500 font-bold text-lg mb-1">Bank is Empty</p>
                  <p className="text-gray-400 text-sm">Add initial questions to populate the global database.</p>
                </div>
             ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {globalBank.filter(q => bankFilter === 'ALL' || q.subject === bankFilter).map((q, i) => (
                    <div key={q.id} onClick={() => toggleBankSelection(q.id)} className={`cursor-pointer p-5 rounded-2xl border transition flex items-start gap-4 ${selectedBankIds.includes(q.id) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                       <input type="checkbox" checked={selectedBankIds.includes(q.id)} onChange={() => {}} className="mt-1 w-5 h-5 text-blue-600 rounded bg-white border-gray-300 focus:ring-blue-500 cursor-pointer pointer-events-none" />
                       <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                             <h4 className="font-bold text-gray-800 leading-relaxed"><span className="text-blue-500 mr-2">Q{i+1}.</span> {q.question_text}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-[11px] text-gray-500 font-bold tracking-wider bg-white px-3 py-1 rounded-full border border-gray-200">ANS: {q.correct_option}</span>
                             <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200">{q.subject}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'LEADERBOARD' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 border-l-4 border-emerald-500 pl-3">Student Performance Leaderboard</h3>
                <button onClick={fetchDetails} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-bold rounded-lg border border-gray-200 transition">↻ Refresh Data</button>
             </div>
             
             {leaderboard.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 text-gray-300">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-gray-500 font-bold text-lg mb-1">No Attempts Yet</p>
                  <p className="text-gray-400 text-sm">Students who submit the exam will appear here in real-time.</p>
                </div>
             ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="p-4 font-bold rounded-tl-2xl">Rank</th>
                        <th className="p-4 font-bold">Student Name</th>
                        <th className="p-4 font-bold">Roll / Reg Number</th>
                        <th className="p-4 font-bold">Score</th>
                        <th className="p-4 font-bold rounded-tr-2xl">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((res, index) => (
                        <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50 transition group">
                          <td className="p-4">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                            {index > 2 && <span className="font-bold text-gray-400 ml-2">#{index + 1}</span>}
                          </td>
                          <td className="p-4 font-bold text-gray-800">{res.users?.name || "Unknown"}</td>
                          <td className="p-4 text-indigo-600 font-black tracking-wider uppercase text-sm">{res.users?.roll_number || "PENDING"}</td>
                          <td className="p-4">
                             <span className="font-black text-lg text-indigo-700">{res.total_score}</span>
                             <span className="text-xs text-gray-400 ml-1">/ {exam.total_marks}</span>
                          </td>
                          <td className="p-4">
                             <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${res.status === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                               {res.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
}
