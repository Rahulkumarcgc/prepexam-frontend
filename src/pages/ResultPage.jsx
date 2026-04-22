import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function ResultPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  
  const [examMeta, setExamMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        // Fetch Exam Meta
        const resExam = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}`);
        const dataExam = await resExam.json();
        if (dataExam.success) setExamMeta(dataExam.exam);

        // Fetch Questions (for text and options)
        const resQues = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}/questions`);
        const dataQues = await resQues.json();
        if (dataQues.success) setQuestions(dataQues.questions);

        // Fetch Specific Submission
        const resSub = await fetch(`https://prepexam-backend.onrender.com/api/users/me/results?clerk_id=${user.id}`);
        const dataSub = await resSub.json();
        if (dataSub.success) {
          const specificSub = dataSub.results.find(r => r.exam_id === parseInt(examId) || r.exam_id === examId);
          setSubmission(specificSub);
        }
      } catch (err) {
        console.error("Failed to load result data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, isLoaded, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Report...</div>;
  if (!submission) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500 text-center px-6">Result Not Found. Please ensure you have completed this exam.</div>;

  const answers = submission.answers || {};

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col items-center py-12 px-6">
       <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
       </div>
       <h1 className="text-3xl md:text-5xl font-black text-white mb-2 text-center">Performance Report</h1>
       <p className="text-gray-400 mb-10 max-w-md text-center text-sm md:text-base">Review your detailed responses and correct answers for {examMeta?.title}.</p>
       
       <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl mb-10">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Final Score</p>
             <h3 className="text-5xl font-black text-white">{submission.total_score} <span className="text-lg text-gray-500">/ {examMeta?.total_marks}</span></h3>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl flex flex-col justify-between">
             <div>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Result Status</p>
               <span className={`px-4 py-1 rounded-xl font-black text-xs uppercase ${submission.status === 'PASS' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                 {submission.status}
               </span>
             </div>
             <button onClick={() => window.print()} className="mt-4 flex items-center gap-2 text-indigo-400 font-bold text-sm hover:text-indigo-300 transition">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
               Download Report (PDF)
             </button>
          </div>
       </div>

       {/* DETAILED REPORT SECTION */}
       <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-10 mb-12 print:bg-white print:text-black">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-black">?</span>
            Detailed Analysis
          </h2>
          
          <div className="space-y-8">
            {questions.map((q, idx) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correct_option;
              return (
                <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'} print:border-gray-200 print:bg-white`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg pr-8"><span className="text-gray-500 mr-2">Q{idx+1}.</span> {q.question_text}</h4>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${userAns === q.correct_option ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'} print:border-gray-300`}>
                      <p className="text-[10px] font-black uppercase mb-1 opacity-60">Your Answer</p>
                      <p className="font-bold text-sm">{userAns ? `${userAns}. ${q['option_' + userAns.toLowerCase()]}` : 'Not Answered'}</p>
                    </div>
                    {!isCorrect && (
                      <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-500/10 print:border-gray-300">
                        <p className="text-[10px] font-black uppercase mb-1 opacity-60 text-emerald-500">Correct Answer</p>
                        <p className="font-bold text-sm text-emerald-400 print:text-emerald-700">{q.correct_option}. {q['option_' + q.correct_option.toLowerCase()]}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
       </div>
       
       <button onClick={() => navigate("/dashboard")} className="px-10 py-4 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition shadow-xl shadow-indigo-500/20 mb-20 print:hidden">Return to Dashboard</button>
    </div>
  );
}
