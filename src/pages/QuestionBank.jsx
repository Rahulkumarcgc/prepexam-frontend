import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

export default function QuestionBank() {
  const navigate = useNavigate();
  const [bank, setBank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('ALL');

  const [qForm, setQForm] = useState({
    subject: "Computer Science", question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A"
  });

  const fetchBank = async () => {
    try {
      const res = await fetch("https://prepexam-backend.onrender.com/api/questions");
      const data = await res.json();
      if (data.success) setBank(data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBank(); }, []);

  const handleInputChange = (e) => setQForm({ ...qForm, [e.target.name]: e.target.value });

  const handleAddStandalone = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("https://prepexam-backend.onrender.com/api/questions/standalone", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(qForm)
      });
      if (resp.ok) {
        setQForm({ ...qForm, question_text: "", option_a: "", option_b: "", option_c: "", option_d: "" });
        fetchBank();
      }
    } catch (error) { alert("Server Offline.");}
  };

  const handleDelete = async (qId) => {
    if(!window.confirm("Permanent Archive Action: Delete this question globally?")) return;
    try {
      const resp = await fetch(`https://prepexam-backend.onrender.com/api/questions/${qId}`, { method: "DELETE" });
      if(resp.ok) fetchBank();
    } catch(err) {}
  };

  // Group Questions by Subject
  const groupedBank = bank.reduce((acc, q) => {
    if(!acc[q.subject]) acc[q.subject] = [];
    acc[q.subject].push(q);
    return acc;
  }, {});

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Databank...</div>;

  return (
    <div className="min-h-screen bg-[#f4f6fa] p-4 font-sans pb-20">
      <nav className="max-w-7xl mx-auto h-16 bg-white rounded-xl shadow-sm flex items-center justify-between px-6 mb-8 border border-gray-100">
        <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg> Global Master DataBank
        </h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate("/dashboard")} className="text-sm font-semibold text-gray-500 border px-4 py-1.5 rounded-md hover:bg-gray-50">Back</button>
          <UserButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-black text-gray-800">Database Repository</h2>

            {Object.keys(groupedBank).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
                 <button onClick={() => setActiveFolder('ALL')} className={`px-5 py-2 text-sm font-bold rounded-lg transition ${activeFolder === 'ALL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-gray-500 hover:text-gray-800'}`}>Show All Repos</button>
                 {Object.keys(groupedBank).map(sub => (
                    <button key={sub} onClick={() => setActiveFolder(sub)} className={`px-5 py-2 text-sm font-bold rounded-lg transition ${activeFolder === sub ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-gray-500 hover:text-gray-800'}`}>{sub}</button>
                 ))}
              </div>
            )}

            {Object.keys(groupedBank).length === 0 && <p className="text-gray-400 font-bold p-10 bg-white rounded-xl shadow-sm">No Questions Data Found</p>}

            {Object.keys(groupedBank).filter(sub => activeFolder === 'ALL' || activeFolder === sub).map(subjectName => (
              <div key={subjectName} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-emerald-50 px-8 py-5 border-b border-emerald-100 flex justify-between items-center">
                  <h3 className="font-bold text-emerald-800 text-xl tracking-wide">{subjectName}</h3>
                  <span className="bg-white px-3 py-1 text-xs font-black text-emerald-600 rounded-full border border-emerald-200">{groupedBank[subjectName].length} MCQs</span>
                </div>
                <div className="p-8 space-y-6">
                   {groupedBank[subjectName].map((q, i) => (
                      <div key={q.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 relative group">
                        <button onClick={() => handleDelete(q.id)} className="absolute top-4 right-4 bg-red-100 text-red-600 px-3 py-1 text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition">Delete</button>
                        <h4 className="font-bold text-gray-800 mb-4 pr-20"><span className="text-emerald-500 mr-2">Q{i+1}.</span> {q.question_text}</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                           <div className={`p-2 rounded-lg ${q.correct_option === 'A' ? 'bg-emerald-100 font-bold border border-emerald-300' : 'bg-white border'}`}>A. {q.option_a}</div>
                           <div className={`p-2 rounded-lg ${q.correct_option === 'B' ? 'bg-emerald-100 font-bold border border-emerald-300' : 'bg-white border'}`}>B. {q.option_b}</div>
                           <div className={`p-2 rounded-lg ${q.correct_option === 'C' ? 'bg-emerald-100 font-bold border border-emerald-300' : 'bg-white border'}`}>C. {q.option_c}</div>
                           <div className={`p-2 rounded-lg ${q.correct_option === 'D' ? 'bg-emerald-100 font-bold border border-emerald-300' : 'bg-white border'}`}>D. {q.option_d}</div>
                        </div>
                      </div>
                   ))}
                </div>
              </div>
            ))}
         </div>

         <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 sticky top-10">
              <h3 className="font-bold text-gray-800 text-lg mb-6 border-l-4 border-emerald-500 pl-3">Add to Repository</h3>
              <form onSubmit={handleAddStandalone} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400">SUBJECT FOLDER</label>
                    <input required name="subject" value={qForm.subject} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-50 rounded-lg text-emerald-700 font-bold uppercase text-sm border focus:outline-none focus:border-emerald-500" placeholder="e.g. Physics" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400">QUESTION STATEMENT</label>
                    <textarea required name="question_text" value={qForm.question_text} onChange={handleInputChange} rows={3} className="w-full mt-1 p-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none"></textarea>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div><label className="text-xs font-bold text-gray-400">A</label><input required name="option_a" value={qForm.option_a} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded-lg text-sm outline-none" /></div>
                   <div><label className="text-xs font-bold text-gray-400">B</label><input required name="option_b" value={qForm.option_b} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded-lg text-sm outline-none" /></div>
                   <div><label className="text-xs font-bold text-gray-400">C</label><input required name="option_c" value={qForm.option_c} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded-lg text-sm outline-none" /></div>
                   <div><label className="text-xs font-bold text-gray-400">D</label><input required name="option_d" value={qForm.option_d} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded-lg text-sm outline-none" /></div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400">CORRECT ANSWER</label>
                    <select name="correct_option" value={qForm.correct_option} onChange={handleInputChange} className="w-full mt-1 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-black text-emerald-800 outline-none cursor-pointer">
                      <option value="A">Option A is Correct</option><option value="B">Option B is Correct</option><option value="C">Option C is Correct</option><option value="D">Option D is Correct</option>
                    </select>
                 </div>
                 <button type="submit" className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition">Save to Master Bank</button>
              </form>
            </div>
         </div>
      </div>
    </div>
  );
}
