import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import emailjs from "@emailjs/browser";

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { 'questionId' : 'A' }
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600); // Fallback until exam loaded
  const [examMeta, setExamMeta] = useState(null);
  
  const [examStarted, setExamStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);

  useEffect(() => {
    // Fetch Exam Info & Questions
    const loadExam = async () => {
      try {
        const resExam = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}`);
        const dataExam = await resExam.json();
        
        if (dataExam.success) {
           setExamMeta(dataExam.exam);
           setTimeLeft(dataExam.exam.duration_minutes * 60);
        }

        const resQues = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}/questions`);
        const dataQues = await resQues.json();
        
        if (dataQues.success) {
           setQuestions(dataQues.questions);
        }
      } catch (err) {
        console.error("Failed to load secure exam.");
      } finally {
        setLoading(false);
      }
    };
    
    if (examId !== 'demo') {
      loadExam();
    } else {
      // Load 10 Hardcoded Demo Questions
      setExamMeta({
        title: "PrepExam Demo Certification",
        duration_minutes: 10,
        total_marks: 10,
        marks_per_question: 1,
        negative_marks: 0.25
      });
      setQuestions([
        { id: 'd1', question_text: "What is the capital of India?", option_a: "Mumbai", option_b: "New Delhi", option_c: "Kolkata", option_d: "Chennai", correct_option: "B" },
        { id: 'd2', question_text: "Which planet is known as the Red Planet?", option_a: "Venus", option_b: "Mars", option_c: "Jupiter", option_d: "Saturn", correct_option: "B" },
        { id: 'd3', question_text: "Which is the largest ocean on Earth?", option_a: "Atlantic", option_b: "Indian", option_c: "Arctic", option_d: "Pacific", correct_option: "D" },
        { id: 'd4', question_text: "What does HTML stand for?", option_a: "HyperText Markup Language", option_b: "HighText Machine Language", option_c: "HyperLoop Main Logic", option_d: "HyperText Multi Language", correct_option: "A" },
        { id: 'd5', question_text: "Which is the fastest land animal on Earth?", option_a: "Lion", option_b: "Cheetah", option_c: "Tiger", option_d: "Horse", correct_option: "B" },
        { id: 'd6', question_text: "Who is known as the Father of the Indian Constitution?", option_a: "Mahatma Gandhi", option_b: "B.R. Ambedkar", option_c: "Jawaharlal Nehru", option_d: "Sardar Patel", correct_option: "B" },
        { id: 'd7', question_text: "What is the currency of Japan?", option_a: "Dollar", option_b: "Yen", option_c: "Won", option_d: "Yuan", correct_option: "B" },
        { id: 'd8', question_text: "What is the main gas found in the Sun?", option_a: "Oxygen", option_b: "Nitrogen", option_c: "Hydrogen", option_d: "Helium", correct_option: "C" },
        { id: 'd9', question_text: "What is the square root of 144?", option_a: "10", option_b: "11", option_c: "12", option_d: "14", correct_option: "C" },
        { id: 'd10', question_text: "Which gas do plants absorb from the atmosphere during photosynthesis?", option_a: "Oxygen", option_b: "Carbon Dioxide", option_c: "Nitrogen", option_d: "Hydrogen", correct_option: "B" }
      ]);
      setTimeLeft(600); // 10 minutes
      setLoading(false);
    }
  }, [examId]);

  // Anti-Cheat tracking & Timer
  useEffect(() => {
    if (!examStarted || examResult) return; // Stop timer if exam is over
    
    const contextHandler = (e) => e.preventDefault();
    const visibilityHandler = () => {
      if (document.hidden) alert("⚠️ WARNING: Tab Switch / Minimization Detected! Administrator has been flagged.");
    };
    const fsHandler = () => {
      if (!document.fullscreenElement) alert("⚠️ WARNING: You exited Fullscreen Mode! This flag is recorded on the server.");
    };
    
    document.addEventListener("contextmenu", contextHandler);
    document.addEventListener("visibilitychange", visibilityHandler);
    document.addEventListener("fullscreenchange", fsHandler);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      document.removeEventListener("contextmenu", contextHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
      document.removeEventListener("fullscreenchange", fsHandler);
      clearInterval(timer);
    };
  }, [examResult, examStarted]); // Depend on examResult so it unmounts cheating listeners once submitted

  const selectOption = (opt) => {
    if (!questions[currentIdx]) return;
    setAnswers({ ...answers, [questions[currentIdx].id]: opt });
  };

  const handleFinalSubmit = async () => {
    if (examId === 'demo') {
       // Calculate Mock Result for Demo
       let score = 0;
       questions.forEach(q => {
         if (answers[q.id] === q.correct_option) score += 1;
         else if (answers[q.id]) score -= 0.25;
       });
       setExamResult({
         total_score: score.toFixed(2),
         status: score >= 4 ? 'PASS' : 'FAIL'
       });
       setSubmitting(false);
       return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`https://prepexam-backend.onrender.com/api/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: user.id,
          answers: answers
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setExamResult(data.result);

        // Send Result Email via EmailJS
        emailjs.send(
          "service_32mzb8d",
          "template_ojegsys",
          {
            student_name: user.fullName || user.firstName || "Student",
            student_email: user.primaryEmailAddress?.emailAddress || "",
            exam_title: examMeta?.title || "Examination",
            total_score: data.result.total_score,
            total_marks: examMeta?.total_marks || "N/A",
            result_status: data.result.status,
            roll_number: user.publicMetadata?.roll_number || "Not set",
            submitted_at: new Date().toLocaleString(),
          },
          "uCKcJ-jhu63oWbXTQ"
        ).catch(err => console.warn("EmailJS result error:", err));

      } else {
        alert("Submission Failed: " + data.error);
      }
    } catch (err) {
      alert("Network Error during submission.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-bold">Encrypting Exam Room...</div>;

  const requestFS = () => {
    try { if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch(e){}
    setExamStarted(true);
  };

  if (!examStarted && !examResult) {
     return (
       <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
           <div className="absolute top-10 flex gap-3 items-center text-red-500 font-bold border border-red-500/20 bg-red-500/10 px-5 py-2 rounded-full tracking-wide">
              <svg className="w-4 h-4 animate-ping" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg> Active Proctoring System
           </div>
           
           <h1 className="text-4xl lg:text-5xl font-black mb-6 text-center tracking-tight leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
             {examMeta?.title || "Examination Environment"}
           </h1>
           <p className="text-gray-400 max-w-2xl text-center mb-10 leading-relaxed">
             By clicking "Begin Assessment", your browser will strictly lock into <strong>Fullscreen Mode</strong>. 
             Do not switch or minimize your browser tab at any time.<br/><br/>
             <span className="text-red-400">🚨 Tab switching, split screening or exiting fullscreen will be automatically recorded as a Cheating violation and heavily flagged to your faculty.</span>
           </p>

           <div className="flex gap-12 mb-12 text-center p-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
             <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Questions</p><p className="text-3xl font-black text-indigo-400">{questions.length}</p></div>
             <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Time Assigned</p><p className="text-3xl font-black text-emerald-400">{examMeta?.duration_minutes || "10"} Mins</p></div>
             <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Maximum Marks</p><p className="text-3xl font-black text-cyan-400">{examMeta?.total_marks || "X"}</p></div>
           </div>

           <button onClick={requestFS} className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 border-2 border-indigo-400/30 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_40px_-5px_rgba(79,70,229,0.5)] transition hover:scale-105 active:scale-95">
             I Understand, Start The Test
           </button>
       </div>
     );
  }

  // IF EXAM IS FINISHED
  if (examResult) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col items-center py-12 px-6">
         <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
         </div>
         <h1 className="text-3xl md:text-5xl font-black text-white mb-2 text-center">Exam Evaluated</h1>
         <p className="text-gray-400 mb-10 max-w-md text-center text-sm md:text-base">Your responses have been processed through the Auto-Grading Engine. You can now review your performance below.</p>
         
         <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl mb-10">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Final Score</p>
               <h3 className="text-5xl font-black text-white">{examResult.total_score} <span className="text-lg text-gray-500">/ {examMeta?.total_marks}</span></h3>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl flex flex-col justify-between">
               <div>
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Result Status</p>
                 <span className={`px-4 py-1 rounded-xl font-black text-xs uppercase ${examResult.status === 'PASS' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                   {examResult.status}
                 </span>
               </div>
               <button onClick={() => window.print()} className="mt-4 flex items-center gap-2 text-indigo-400 font-bold text-sm hover:text-indigo-300 transition">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 Download Answer Report (PDF)
               </button>
            </div>
         </div>

         {/* DETAILED REPORT SECTION */}
         <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-10 mb-12 print:bg-white print:text-black">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-black">?</span>
              Response Analysis
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
         
         <button onClick={() => navigate("/dashboard")} className="px-10 py-4 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition shadow-xl shadow-indigo-500/20 mb-20">Return to Portals Dashboard</button>
      </div>
    );
  }

  // IF EXAM IS ACTIVE
  const q = questions[currentIdx];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans select-none">
      {/* STATUS BAR */}
      <div className="h-16 bg-gray-950 border-b border-gray-800 flex justify-between items-center px-8 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="hidden md:inline font-mono text-sm tracking-widest text-red-400 font-bold">{examMeta?.title || "SECURE EXAM"} IN PROGRESS</span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <div className="font-mono text-lg md:text-xl font-bold text-white bg-gray-800 px-4 py-1.5 rounded-lg border border-gray-700 transition-colors" style={{ color: timeLeft < 300 ? '#ef4444' : 'white' }}>
             {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <button onClick={() => { if(window.confirm("Submit exam final answers?")) handleFinalSubmit(); }} disabled={submitting} className="px-4 py-2 md:px-6 md:py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg transition">Submit Exam</button>
        </div>
      </div>

      {/* EXAM CONTENT */}
      {questions.length === 0 ? (
         <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">This Exam has no questions added yet.</div>
      ) : (
        <div className="flex-1 w-full max-w-4xl mx-auto py-12 px-6">
          <div className="text-gray-400 text-sm mb-2 uppercase tracking-wide font-bold flex justify-between w-full">
             <span>Question {currentIdx + 1} of {questions.length}</span>
             <span className="text-gray-500 text-xs">+{examMeta?.marks_per_question} / -{examMeta?.negative_marks}</span>
          </div>
          
          <div className="bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-xl mb-6 min-h-[300px]">
            <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-8">{q.question_text}</h2>
            
            <div className="space-y-4">
              <label onClick={() => selectOption('A')} className={`flex items-center gap-4 p-5 rounded-xl border transition cursor-pointer ${answers[q.id] === 'A' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-700/50'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${answers[q.id] === 'A' ? 'border-indigo-500' : 'border-gray-500'}`}>
                   {answers[q.id] === 'A' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>}
                </div>
                <span className="text-lg">A. {q.option_a}</span>
              </label>
              
              <label onClick={() => selectOption('B')} className={`flex items-center gap-4 p-5 rounded-xl border transition cursor-pointer ${answers[q.id] === 'B' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-700/50'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${answers[q.id] === 'B' ? 'border-indigo-500' : 'border-gray-500'}`}>
                   {answers[q.id] === 'B' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>}
                </div>
                <span className="text-lg">B. {q.option_b}</span>
              </label>

              <label onClick={() => selectOption('C')} className={`flex items-center gap-4 p-5 rounded-xl border transition cursor-pointer ${answers[q.id] === 'C' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-700/50'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${answers[q.id] === 'C' ? 'border-indigo-500' : 'border-gray-500'}`}>
                   {answers[q.id] === 'C' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>}
                </div>
                <span className="text-lg">C. {q.option_c}</span>
              </label>

              <label onClick={() => selectOption('D')} className={`flex items-center gap-4 p-5 rounded-xl border transition cursor-pointer ${answers[q.id] === 'D' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-700/50'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${answers[q.id] === 'D' ? 'border-indigo-500' : 'border-gray-500'}`}>
                   {answers[q.id] === 'D' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>}
                </div>
                <span className="text-lg">D. {q.option_d}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center gap-4 mt-6 border-t border-gray-800 pt-6">
            <button 
              onClick={() => setCurrentIdx(prev => prev > 0 ? prev - 1 : prev)} 
              className={`px-6 py-3 font-bold text-gray-400 transition ${currentIdx === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}>
              ← Previous
            </button>
            <div className="flex gap-2 flex-wrap justify-center max-w-[150px] md:max-w-none">
               {questions.map((_, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full flex-shrink-0 ${i === currentIdx ? 'bg-white' : answers[questions[i].id] ? 'bg-indigo-500/50' : 'bg-gray-700'}`}></div>
               ))}
            </div>
            {currentIdx < questions.length - 1 ? (
              <button onClick={() => setCurrentIdx(prev => prev + 1)} className="px-8 py-3 bg-white text-gray-900 font-extrabold rounded-xl hover:bg-gray-200 transition shadow-lg">Save & Next →</button>
            ) : (
              <button disabled={submitting} onClick={() => { if(window.confirm("Submit exam final answers?")) handleFinalSubmit(); }} className="px-8 py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition shadow-lg">Submit Final →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
