import { useState } from 'react';
import { Send, Bot, User, FileText, Search, Database } from 'lucide-react';

export default function RagQuery() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am your AI Data Assistant. I can analyze dashboard data, project reports, and CSVs. Highlight any text or ask me a question directly.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages([...newMsgs, { 
        role: 'ai', 
        content: `I've analyzed the query related to "${input}". Based on the underlying CSV data, this anomaly is driven by a 45% budget overrun in material costs. Would you like me to generate a chart for this?` 
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Pane - Document/Context Viewer */}
      <div className="w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-2 items-center">
          <FileText size={18} className="text-slate-500" />
          <h3 className="font-semibold text-slate-700">Context Viewer (MPLADS Report.pdf)</h3>
        </div>
        <div className="p-6 overflow-auto flex-1 text-slate-600 space-y-4 text-sm leading-relaxed">
          <p>
            The execution phase of the MPLADS scheme in Bihar (Work ID: MP/BR/08921) has shown significant irregularities. 
            <span className="bg-yellow-200 text-yellow-900 px-1 rounded cursor-help" title="Click to ask AI about this">
              Initial budget estimates were sanctioned at ₹ 45 Lakhs, but subsequent expenditure recorded a spike to ₹ 72 Lakhs
            </span> without formal recommendations for phase 2.
          </p>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2 font-medium text-slate-700">
              <Database size={16} /> Attached Data Grid (Preview)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2">Stage</th>
                  <th className="p-2">Amount (₹)</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="p-2">Sanctioned</td>
                  <td className="p-2">45,00,000</td>
                  <td className="p-2">12 Apr 2024</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="p-2 text-red-600 font-semibold">Expenditure</td>
                  <td className="p-2 text-red-600 font-semibold">72,50,000</td>
                  <td className="p-2 text-red-600 font-semibold">01 Sep 2024</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Field investigation suggests material cost inflation and potential ghost vendors involved in the procurement process.
          </p>
        </div>
      </div>

      {/* Right Pane - AI Chat */}
      <div className="w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-2 items-center">
          <Bot size={18} className="text-teal-600" />
          <h3 className="font-semibold text-slate-700">Smart Query & Insights</h3>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-auto space-y-4 bg-slate-50/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-teal-100 text-teal-700'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={18} />
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the highlighted text or any data..." 
              className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
            />
            <button 
              type="submit"
              className="absolute right-2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
