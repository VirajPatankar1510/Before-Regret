import React, { useState } from 'react';
import { 
  User, 
  Award, 
  Heart, 
  PlusCircle, 
  Bookmark, 
  Compass, 
  CheckCircle2, 
  Clock, 
  Globe, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  MessageCircle, 
  FolderOpen 
} from 'lucide-react';
import { UserProfile, Story, StoryComment } from '../types';

interface ProfileScreenProps {
  user: UserProfile;
  allStories: Story[];
  setScreen: (screen: { type: string; slug?: string }) => void;
  onRemoveBookmark: (id: string) => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
  onLogout?: () => void;
  comments?: StoryComment[];
}

export default function ProfileScreen({ 
  user, 
  allStories, 
  setScreen, 
  onRemoveBookmark,
  currentUser,
  onGoogleLogin,
  onLogout,
  comments = []
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'responses'>('profile');

  // If mock profile is loaded but no logged in user, show connecting interface
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4 animate-fadeIn text-white space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#4F8CFF] to-pink-500 font-extrabold text-white text-xl mx-auto border-2 border-indigo-400/30">
          BR
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Connect Google Account</h2>
          <p className="text-xs text-[#AAB2C0] leading-relaxed max-w-sm mx-auto">
            Connect your Google identity securely to persist your relationship timeline models across sessions, unlock verified badges, and monitor reviewer opinions.
          </p>
        </div>

        <div className="bg-[#161B22] p-5 sm:p-6 rounded-2xl border border-[#30363D] space-y-4 shadow-xl text-left">
          <div className="space-y-2.5 text-xs text-[#AAB2C0]">
            <div className="flex items-start gap-2">
              <span className="text-[#F4B942] font-bold">✔</span>
              <span><strong>Durable Cloud Ledger</strong>: Access your logs securely from any location or sandbox session.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#F4B942] font-bold">✔</span>
              <span><strong>Outcome Replies Inbox</strong>: Directly monitor peer advice, mentoring, or critical opinions received on your timeline.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#F4B942] font-bold">✔</span>
              <span><strong>Privacy Priority</strong>: BeforeRegret respects your choice to post under a fully customized nickname. No emails or facial scans are linked.</span>
            </div>
          </div>

          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F4B942] hover:bg-[#F4B942]/90 py-3 text-sm font-black text-neutral-900 transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <LogIn className="h-4 w-4" /> Sign In with Google
          </button>
        </div>

        <button
          onClick={() => setScreen({ type: 'home' })}
          className="text-xs text-[#AAB2C0] hover:text-white underline"
        >
          Return to Explore Outcomes
        </button>
      </div>
    );
  }

  // --- LOGGED IN LOGIC ---
  // Compute bookmarks
  const bookmarkedStories = allStories.filter(s => user.savedStories.includes(s.id));

  // Determine user submitted stories: either keyed by userId or with their displayName mapped
  const userStories = allStories.filter(s => {
    return s.userId === currentUser.uid || s.userName === currentUser.displayName || s.userName.toLowerCase() === (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '');
  });

  const userStoryIds = userStories.map(s => s.id);
  // Find comments left on user's stories, authored by other people
  const receivedComments = comments.filter(c => userStoryIds.includes(c.storyId) && c.authorId !== currentUser.uid);

  const badgesList = [
    { name: "Heart Survivor", desc: "Successfully survived and logged a crisis outcome of high regret", unlocked: user.badges.includes("Heart Survivor") || bookmarkedStories.length > 0 },
    { name: "Google Connected", desc: "Successfully bridged identity credentials with Google Cloud auth", unlocked: true },
    { name: "Outcome Contributor", desc: "Submitted at least one dynamic chronological case template", unlocked: user.storiesSubmitted > 0 || userStories.length > 0 },
    { name: "Relationship Veteran", desc: "Maintained an active timeline updating for more than 1 year", unlocked: user.storiesSubmitted > 0 || userStories.length > 0 },
    { name: "Trusted Contributor", desc: "Receive peer gratitude markers under registered timeline accounts", unlocked: true }
  ];

  return (
    <div className="space-y-6 pb-16 animate-fadeIn text-white">
      
      {/* HEADER PROFILE AVATAR BLOCK */}
      <div className="rounded-2xl border border-[#30363D] bg-gradient-to-r from-indigo-900/20 to-[#161B22] p-5 sm:p-6 text-left relative overflow-hidden flex flex-col sm:flex-row items-center gap-5">
        <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-[#4F8CFF]/15 blur-2xl" />

        {currentUser.photoURL ? (
          <img src={currentUser.photoURL} alt="Google Profile" className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl border-2 border-indigo-400/40 shrink-0 object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#4F8CFF] to-pink-500 font-black text-xl shrink-0 border-2 border-indigo-400/40 uppercase">
            {(currentUser.displayName || 'G').slice(0, 2)}
          </div>
        )}

        <div className="space-y-1.5 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-white">@{currentUser.displayName || 'Google Seeker'}</h1>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Sync Connected
            </span>
          </div>
          <p className="text-xs text-[#AAB2C0] leading-relaxed max-w-xl">
            You are logged in securely using <strong>{currentUser.email}</strong>. Live responses received on your outcome timelines are consolidated directly in your mailbox below.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="sm:absolute sm:top-5 sm:right-5 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 px-3 py-1.5 text-xs font-bold transition-all"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>

      {/* TABS CONTROL */}
      <div className="flex border-b border-[#30363D]">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'profile' 
              ? 'border-[#4F8CFF] text-[#4F8CFF]' 
              : 'border-transparent text-[#AAB2C0] hover:text-white'
          }`}
        >
          My Profile & Actions
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 relative ${
            activeTab === 'responses' 
              ? 'border-[#4F8CFF] text-[#4F8CFF]' 
              : 'border-transparent text-[#AAB2C0] hover:text-white'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> 
          <span>Received Responses Inbox</span>
          {receivedComments.length > 0 && (
            <span className="h-5 w-5 bg-indigo-500 text-white rounded-full text-[10px] flex items-center justify-center font-black animate-pulse">
              {receivedComments.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <>
          {/* METRICS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "My Stories Published", val: userStories.length, sub: "Dynamic ledger models" },
              { label: "Helpful Peer Upvotes", val: userStories.reduce((acc, current) => acc + (current.helpfulVotes || 0), 0), sub: "Total community validation" },
              { label: "Total Bookmarks", val: bookmarkedStories.length, sub: "Saved chronicles" },
              { label: "Live Received Responses", val: receivedComments.length, sub: "Peer mentoring" }
            ].map((block, i) => (
              <div key={i} className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 text-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#AAB2C0] block mb-1 leading-tight">{block.label}</span>
                <span className="text-lg sm:text-xl font-black text-[#4F8CFF] block">{block.val}</span>
                <span className="text-[9px] text-zinc-500 block mt-1">{block.sub}</span>
              </div>
            ))}
          </div>

          {/* PROFILE SECTIONS SPLIT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fadeIn">
            
            {/* Left Columns: Badges Array */}
            <div className="md:col-span-4 rounded-xl border border-[#30363D] bg-[#161B22] p-4 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Verification Achievements</h3>
                <p className="text-[10px] text-[#AAB2C0] mt-0.5">Badges unlocked dynamically through cloud profile validation and ledger updates.</p>
              </div>

              <div className="space-y-2.5">
                {badgesList.map(b => (
                  <div
                    key={b.name}
                    className={`rounded-xl border p-3 flex items-start gap-2.5 transition-all ${
                      b.unlocked ? 'bg-gradient-to-tr from-indigo-950/20 to-[#161B22] border-indigo-500/20 text-white' : 'bg-zinc-800/25 border-zinc-855 text-[#AAB2C0]/50 opacity-60'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                      b.unlocked ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-900 border-zinc-750 text-zinc-650'
                    }`}>
                      <Award className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold leading-none">{b.name}</span>
                        {b.unlocked && <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                      </div>
                      <p className="text-[10px] leading-normal text-zinc-450">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Columns: saved story list */}
            <div className="md:col-span-8 space-y-4">
              
              {/* My Stories Folder */}
              <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4 text-[#F4B942]" /> My Chronological Outcomes ({userStories.length})
                </h3>

                {userStories.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-400 border border-dashed border-[#30363D] rounded-xl">
                    <p className="text-xs">You haven't submitted any relationship timeline stories yet.</p>
                    <button
                      onClick={() => setScreen({ type: 'home' })}
                      className="mt-3 px-3 py-1.5 text-xs bg-[#4F8CFF] font-bold text-white rounded-lg"
                    >
                      Record Story Timeline
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {userStories.map(story => (
                      <div
                        key={story.id}
                        onClick={() => setScreen({ type: 'situation', slug: story.situationSlug })}
                        className="rounded-lg border border-[#30363D]/60 bg-[#0E131B] p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-[#4F8CFF] transition-all"
                      >
                        <div>
                          <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                            {story.situationName}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1">"{story.title}"</h4>
                          <p className="text-[10px] text-[#AAB2C0]">Regret Score: {story.regretScore}/10 • Votes: {story.helpfulVotes}</p>
                        </div>
                        <span className="text-[10px] text-[#4F8CFF] font-semibold hover:underline">View Post</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Stories Folder */}
              <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Bookmark className="h-4 w-4 text-[#4F8CFF]" /> Saved Outcome Chronicles ({bookmarkedStories.length})
                </h3>

                {bookmarkedStories.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-[#30363D] rounded-xl">
                    <Bookmark className="h-6 w-6 mb-1 text-zinc-600" />
                    <p className="text-xs">Your bookmarks folder is empty.</p>
                    <p className="text-[10px] text-zinc-500">Save timeline stories of other users to review their post-decision advice later.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {bookmarkedStories.map(story => (
                      <div
                        key={story.id}
                        onClick={() => setScreen({ type: 'situation', slug: story.situationSlug })}
                        className="rounded-lg border border-[#30363D] bg-[#0E131B] p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-[#4F8CFF] transition-all"
                      >
                        <div>
                          <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                            {story.situationName}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1">"{story.title}"</h4>
                          <p className="text-[10px] text-[#AAB2C0]">By @{story.userName} • Regret Score: {story.regretScore}/10</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveBookmark(story.id);
                          }}
                          className="text-[10px] font-bold text-[#FF5D5D] hover:underline px-2.5 py-1.5 bg-red-500/5 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 shrink-0"
                        >
                          Delete Bookmark
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      ) : (
        /* RESPONSES MAILBOX TAB */
        <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Advice Responses Received</h3>
            <p className="text-[10px] text-[#AAB2C0] mt-0.5">Review mentoring advices, logic breakdowns, and peer experiences wrote on your timeline logs.</p>
          </div>

          {receivedComments.length === 0 ? (
            <div className="py-12 border border-dashed border-[#30363D] rounded-xl text-center text-zinc-500 space-y-2">
              <MessageCircle className="h-8 w-8 mx-auto text-zinc-650" />
              <p className="text-xs font-bold text-zinc-400">Your Responses Inbox is currently silent.</p>
              <p className="text-[10px] text-zinc-500 max-w-sm mx-auto">
                Once peer members provide supportive analysis, mentoring insights or constructive reviews on your outcome chronicles, they will list instantly here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedComments.map((comment) => {
                const sourceStory = userStories.find(s => s.id === comment.storyId);
                return (
                  <div 
                    key={comment.id}
                    className="p-4 rounded-xl border border-[#30363D] bg-[#0E131B] space-y-3 hover:border-indigo-500/50 transition-all cursor-pointer"
                    onClick={() => {
                      if (sourceStory) {
                        setScreen({ type: 'situation', slug: sourceStory.situationSlug });
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363D]/50 pb-2">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-extrabold text-white">@{comment.authorName}</span>
                        <span className="text-[#AAB2C0]">replied on your outcome story</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{comment.dateAdded}</span>
                    </div>

                    <div className="space-y-2">
                      {sourceStory && (
                        <div className="text-[10px] text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded-md inline-block font-sans">
                          Story Reference: "{sourceStory.title}"
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-neutral-200 font-serif whitespace-pre-wrap pl-1">
                        "{comment.text}"
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#4F8CFF] font-semibold hover:underline">
                        Go to Chronicle Discussion →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
