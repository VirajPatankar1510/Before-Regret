import React, { useState, useEffect } from 'react';
import { DirectQuery } from '../types';
import { MapPin, Image, Paperclip, Send, ArrowLeft, ShieldCheck, Check, Clock, Eye, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseSlotTimeRange } from '../utils/slotHelper';

interface ChatMessageItem {
  id: string;
  senderId: string;
  senderRole: 'buyer' | 'expert';
  text: string;
  createdAt: string;
  mapPin?: { name: string; coordinates: string };
  imageAttachment?: string;
}

interface MessagingProps {
  query: DirectQuery;
  onBack: () => void;
  onSubmitAnswer: (queryId: string, answerText: string) => void;
  activeRole: 'buyer' | 'expert';
  backText?: string;
}

export const Messaging: React.FC<MessagingProps> = ({
  query,
  onBack,
  onSubmitAnswer,
  activeRole,
  backText,
}) => {
  const { user, expertProfile } = useAuth();
  const currentUserId = user ? user.uid : '';
  const currentExpertId = expertProfile ? expertProfile.id : '';

  const [now, setNow] = useState(new Date());
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg_1',
      senderId: query.buyerId,
      senderRole: 'buyer',
      text: query.queryText,
      createdAt: query.createdAt
    },
    {
      id: 'msg_2',
      senderId: query.expertId,
      senderRole: 'expert',
      text: "Hello! Thanks for reaching out. I'm currently looking into the points you raised and will compile a comprehensive resident audit/report for you very soon. Let me know if there are any specific local issues you'd like me to address!",
      createdAt: new Date(new Date(query.createdAt).getTime() + 15 * 60 * 1000).toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const slotRange = query.bookedSlot ? parseSlotTimeRange(query.bookedSlot) : null;
  const isBefore = slotRange ? now < slotRange.start : false;
  const isActive = slotRange ? (now >= slotRange.start && now <= slotRange.end) : true;
  const isAfter = slotRange ? now > slotRange.end : false;

  // Compute countdown text
  let countdownText = '';
  if (slotRange && isBefore) {
    const diffMs = slotRange.start.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (3600 * 1000));
    const diffMins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    const diffSecs = Math.floor((diffMs % (60 * 1000)) / 1000);
    const parts = [];
    if (diffHrs > 0) parts.push(`${diffHrs}h`);
    if (diffMins > 0 || diffHrs > 0) parts.push(`${diffMins}m`);
    parts.push(`${diffSecs}s`);
    countdownText = parts.join(' ');
  }

  // Compute session end countdown
  let sessionEndsText = '';
  if (slotRange && isActive) {
    const diffMs = slotRange.end.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffSecs = Math.floor((diffMs % (60 * 1000)) / 1000);
    sessionEndsText = `${diffMins}m ${diffSecs}s`;
  }

  // Send standard chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessageItem = {
      id: `msg_${Date.now()}`,
      senderId: activeRole === 'buyer' ? currentUserId : currentExpertId,
      senderRole: activeRole,
      text: inputText,
      createdAt: new Date().toISOString()
    };

    setMessages([...messages, newMsg]);
    setInputText('');
  };

  // Send simulated image attachment
  const handleAttachImage = () => {
    const newMsg: ChatMessageItem = {
      id: `msg_${Date.now()}`,
      senderId: activeRole === 'buyer' ? currentUserId : currentExpertId,
      senderRole: activeRole,
      text: "Attached a snapshot of the main entrance gate parking rules notice board:",
      createdAt: new Date().toISOString(),
      imageAttachment: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=350"
    };
    setMessages([...messages, newMsg]);
  };

  // Send simulated map location pin
  const handleAttachMap = () => {
    const newMsg: ChatMessageItem = {
      id: `msg_${Date.now()}`,
      senderId: activeRole === 'buyer' ? currentUserId : currentExpertId,
      senderRole: activeRole,
      text: "Pinned the exact location of the borewell pump room and water tanker queues:",
      createdAt: new Date().toISOString(),
      mapPin: { name: "Society Pump House & Tanker Gate", coordinates: "19.1356° N, 72.8583° E" }
    };
    setMessages([...messages, newMsg]);
  };

  const handleFinalReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAnswer.trim().length < 30) {
      alert('Please provide a comprehensive answer report (minimum 30 characters) to release the secured funds.');
      return;
    }
    onSubmitAnswer(query.id, finalAnswer);
    setShowAnswerForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
      {/* Messaging Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>{backText || 'Exit Messaging'}</span>
        </button>

        <div className="text-right">
          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-emerald-100 rounded-md">
            ₹{query.pricePaid} Secured Hold Active
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Inquiry Ref: #{query.id.split('_')[1] || query.id}</p>
        </div>
      </div>

      {/* Society Metadata Header Banner */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-bold text-slate-800 text-xs sm:text-sm">Inquiry Topic: {query.localityName}</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Buyer: Rohan Deshmukh • Expert: Priya</p>
        </div>
        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          {query.status}
        </span>
      </div>

      {/* CHAT WINDOW INTERFACE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[480px] relative">
        
        {query.packageOption === 'LIVE_CHAT' && (
          <div className="bg-orange-50/90 border-b border-orange-100 px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAfter && !forceOpen ? 'bg-slate-400' : 'bg-orange-500 animate-pulse'}`} />
              <div>
                <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block font-sans">
                  {isAfter && !forceOpen ? 'Live Chat Concluded' : 'Live 30-Min Chat Consult Active'}
                </span>
                <span className="text-[11px] text-orange-700 font-medium font-mono">
                  Slot: {query.bookedSlot || 'Today, 05:00 PM - 05:30 PM'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-orange-500 font-bold block uppercase tracking-wider">
                {isAfter && !forceOpen ? 'Status' : 'Session Ends In'}
              </span>
              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${isAfter && !forceOpen ? 'text-slate-600 bg-slate-200' : 'text-orange-800 bg-orange-100'}`}>
                {isAfter && !forceOpen ? 'CONCLUDED' : (forceOpen ? '29m 45s' : (sessionEndsText || '00m 00s'))}
              </span>
            </div>
          </div>
        )}

        {query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-2.5 leading-relaxed z-10">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              This live 30-minute session has concluded. The chat is archived. The resident expert can now compile the final society report to release the held session payout.
            </span>
          </div>
        )}

        {query.packageOption === 'LIVE_CHAT' && query.bookedSlot && isBefore && !forceOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50/50 space-y-6 overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center text-xl shadow-xs">
              ⏰
            </div>
            
            <div className="max-w-md space-y-2">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block font-sans">
                Live Chat Scheduled
              </span>
              <h3 className="font-display font-black text-slate-900 text-base leading-snug">
                This Chat Room Opens at the Booked Slot Time
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                To guarantee focus and direct peer consultation, live chats are locked until the scheduled start time. We have dispatched a 15-minute start reminder to both expert and buyer.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 max-w-xs w-full shadow-3xs space-y-3">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Scheduled Slot:</span>
                <p className="text-xs font-black text-slate-800 font-mono bg-slate-50 border border-slate-100 py-1 rounded-lg">
                  {query.bookedSlot}
                </p>
              </div>
              
              <div className="pt-1.5 border-t border-slate-100">
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Opens In:</span>
                <span className="text-lg font-black text-orange-600 font-mono tracking-tight block">
                  {countdownText || 'Opening...'}
                </span>
              </div>
            </div>

            <div className="pt-2 max-w-xs w-full">
              <button
                type="button"
                onClick={() => setForceOpen(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>⚡ Bypass Lock & Open Chat Room</span>
              </button>
              <p className="text-[9px] text-slate-400 mt-2 font-sans leading-relaxed max-w-[260px] mx-auto">
                *Use this simulation bypass to immediately open the chat window for testing and verification without waiting.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages list scroller */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
              
              {messages.map((msg) => {
                const isMe = activeRole === 'buyer' ? msg.senderRole === 'buyer' : msg.senderRole === 'expert';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-3xs'
                    }`}>
                      {/* Sender Name */}
                      <span className={`block text-[9px] uppercase tracking-wider font-bold mb-1.5 ${
                        isMe ? 'text-blue-200' : 'text-slate-400'
                      }`}>
                        {msg.senderRole === 'buyer' ? `${query.buyerName} (Buyer)` : `${query.expertName} (Expert)`}
                      </span>

                      {/* Body Text */}
                      <p className="leading-relaxed font-medium whitespace-pre-line">{msg.text}</p>

                      {/* Optional Image Attachment */}
                      {msg.imageAttachment && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-100 max-w-sm">
                          <img
                            src={msg.imageAttachment}
                            alt="attachment"
                            className="w-full object-cover max-h-48"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-2 bg-white text-[10px] text-slate-500 font-mono">
                            image_attachment_shared.jpg
                          </div>
                        </div>
                      )}

                      {/* Optional Map Pin */}
                      {msg.mapPin && (
                        <div className="mt-3 bg-slate-100 border border-slate-200/80 p-3 rounded-xl flex items-center gap-2.5 text-slate-700 max-w-xs">
                          <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <strong className="font-bold text-[11px] block">{msg.mapPin.name}</strong>
                            <span className="text-[9px] font-mono text-slate-500">{msg.mapPin.coordinates}</span>
                          </div>
                        </div>
                      )}

                      {/* Time stamp */}
                      <span className={`block text-[9px] text-right mt-2 ${
                        isMe ? 'text-blue-200/80' : 'text-slate-400'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Chat Control Inputs Toolbar */}
            <div className="border-t border-slate-200 p-3 sm:p-4 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                
                {/* Quick Actions Attachments */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen}
                    onClick={handleAttachMap}
                    title="Pin Map"
                    className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>

                {/* Input Form field */}
                <input
                  type="text"
                  disabled={query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen}
                  placeholder={
                    query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen
                      ? "Live session has concluded"
                      : "Ask for details or write message..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-3xs cursor-pointer shrink-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}

      </div>

      {/* SPECIAL ACTIVE EXPERT RESPONSE GIG GATEWAY PANEL */}
      {activeRole === 'expert' && query.status !== 'ANSWERED' && (
        <div className="mt-8 bg-emerald-50/70 border-2 border-emerald-100 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-500 text-white p-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Resident Final Answers Form</h3>
                <p className="text-xs text-slate-500 font-medium">Draft your compiled society report. This submits the answers and releases the pending balance.</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAnswerForm(!showAnswerForm)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              {showAnswerForm ? 'Hide Form' : 'Compile Final Report'}
            </button>
          </div>

          {showAnswerForm && (
            <form onSubmit={handleFinalReportSubmit} className="space-y-4 pt-3 border-t border-emerald-100/60">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Your final response message (sent to Rohan):
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide key details regarding water tanker dependency, parking restrictions, CBSE schools availability, maid rates, etc..."
                  value={finalAnswer}
                  onChange={(e) => setFinalAnswer(e.target.value)}
                  className="w-full p-4 text-xs sm:text-sm border border-slate-200 rounded-xl outline-hidden text-slate-800 leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-between items-center bg-white border border-emerald-100 rounded-xl p-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">✓ Funds released immediately on submission</span>
                <span className="font-mono">Expected payout: <strong className="text-slate-800">Rs. {query.expertEarnings}</strong></span>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Submit Report & Settle Funds
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
};
