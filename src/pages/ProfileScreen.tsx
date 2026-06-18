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
      <div className="max-w-md mx-auto text-center py-12 px-4 animate-fadeIn space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF8E1] border-2 border-[#E8D79B] font-extrabold text-[#C9A227] text-xl mx-auto shadow-sm">
          BR
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-[#24324A] font-serif">Connect Google Account</h2>
          <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm mx-auto font-semibold">
            Connect your Google identity securely to persist your relationship timeline models across sessions, unlock verified badges, and monitor reviewer opinions.
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] space-y-4 shadow-sm text-left">
          <div className="space-y-2.5 text-xs text-[#374151] font-medium">
            <div className="flex items-start gap-2">
              <span className="text-[#C9A227] font-bold">✔</span>
              <span><strong>Durable Cloud Ledger</strong>: Access your logs securely from any location or sandbox session.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#C9A227] font-bold">✔</span>
              <span><strong>Outcome Replies Inbox</strong>: Directly monitor peer advice, mentoring, or critical opinions received on your timeline.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#C9A227] font-bold">✔</span>
              <span><strong>Privacy Priority</strong>: BeforeRegret respects your choice to post under a fully customized nickname. No emails or facial scans are linked.</span>
            </div>
          </div>

          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#24324A] hover:bg-[#1C273A] py-3 text-sm font-bold text-white transition-all shadow-sm active:scale-95 cursor-pointer uppercase tracking-wider font-mono"
          >
            <LogIn className="h-4 w-4" /> Sign In with Google
          </button>
        </div>

        <button
          onClick={() => setScreen({ type: 'home' })}
          className="text-xs text-[#6B7280] hover:text-[#24324A] font-bold hover:underline"
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
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* HEADER PROFILE AVATAR BLOCK */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 text-left relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 shadow-sm">
        {currentUser.photoURL ? (
          <img src={currentUser.photoURL} alt="Google Profile" className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl border border-[#E5E7EB] shrink-0 object-cover shadow-xs" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-[#FFF8E1] border border-[#E8D79B] font-bold text-[#C9A227] text-xl shrink-0 uppercase">
            {(currentUser.displayName || 'G').slice(0, 2)}
          </div>
        )}

        <div className="space-y-1.5 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-[#24324A] font-serif">@{currentUser.displayName || 'Google Seeker'}</h1>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-[#2E7D32] border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <ShieldCheck className="h-3 w-3" /> Sync Connected
            </span>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed max-w-xl font-medium">
            You are logged in securely using <strong>{currentUser.email}</strong>. Live responses received on your outcome timelines are consolidated directly in your mailbox below.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="sm:absolute sm:top-5 sm:right-5 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-[#C0392B] px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>

      {/* TABS CONTROL */}
      <div className="flex border-b border-[#ECECEC] font-sans font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'profile' 
              ? 'border-[#24324A] text-[#24324A]' 
              : 'border-transparent text-[#6B7280] hover:text-[#24324A]'
          }`}
        >
          My Profile & Actions
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all flex items-center gap-2 relative ${
            activeTab === 'responses' 
              ? 'border-[#24324A] text-[#24324A]' 
              : 'border-transparent text-[#6B7280] hover:text-[#24324A]'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> 
          <span>Received Responses Inbox</span>
          {receivedComments.length > 0 && (
            <span className="h-5 w-5 bg-[#C9A227] text-white rounded-full text-[10px] flex items-center justify-center font-bold font-mono">
              {receivedComments.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <>
          {/* METRICS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-semibold font-sans">
            {[
              { label: "My Stories Published", val: userStories.length, sub: "Dynamic ledger models" },
              { label: "Helpful Peer Upvotes", val: userStories.reduce((acc, current) => acc + (current.helpfulVotes || 0), 0), sub: "Total community validation" },
              { label: "Total Bookmarks", val: bookmarkedStories.length, sub: "Saved chronicles" },
              { label: "Live Received Responses", val: receivedComments.length, sub: "Peer mentoring" }
            ].map((block, i) => (
              <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-center shadow-xs">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#6B7280] block mb-1 leading-tight font-mono">{block.label}</span>
                <span className="text-lg sm:text-xl font-bold text-[#24324A] block">{block.val}</span>
                <span className="text-[9px] text-zinc-400 block mt-1 font-mono">{block.sub}</span>
              </div>
            ))}
          </div>

          {/* PROFILE SECTIONS SPLIT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fadeIn">
            
            {/* Left Columns: Badges Array */}
            <div className="md:col-span-4 rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] font-mono">Verification Achievements</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5 font-medium">Badges unlocked dynamically through cloud profile validation and ledger updates.</p>
              </div>

              <div className="space-y-2.5">
                {badgesList.map(b => (
                  <div
                    key={b.name}
                    className={`rounded-xl border p-3 flex items-start gap-2.5 transition-all ${
                      b.unlocked 
                        ? 'bg-[#FAF8F2] border-[#E5E7EB] text-[#1F2937]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-50'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                      b.unlocked ? 'bg-[#FFF8E1] border-[#E8D79B] text-[#C9A227]' : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                    }`}>
                      <Award className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold leading-none font-sans">{b.name}</span>
                        {b.unlocked && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C9A227]" />}
                      </div>
                      <p className="text-[10px] leading-normal text-zinc-500 font-medium">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Columns: saved story list */}
            <div className="md:col-span-8 space-y-4">
              
              {/* My Stories Folder */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] flex items-center gap-1.5 font-mono">
                  <FolderOpen className="h-4 w-4 text-[#C9A227]" /> My Chronological Outcomes ({userStories.length})
                </h3>

                {userStories.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-400 border border-dashed border-[#E5E7EB] rounded-xl bg-[#FAF8F2] font-semibold">
                    <p className="text-xs text-zinc-500">You haven't submitted any relationship timeline stories yet.</p>
                    <button
                      onClick={() => setScreen({ type: 'home' })}
                      className="mt-3 px-3 py-1.5 text-xs bg-[#24324A] hover:bg-[#1C273A] font-bold text-white rounded-lg transition-all shadow-xs"
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
                        className="rounded-lg border border-[#E5E7EB] bg-[#FAF8F2] p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-[#24324A]/60 transition-all font-serif italic shadow-2xs"
                      >
                        <div>
                          <span className="text-[9px] uppercase font-bold text-[#24324A] bg-[#24324A]/5 px-1.5 py-0.5 rounded font-sans border border-[#24324A]/10">
                            {story.situationName}
                          </span>
                          <h4 className="text-xs font-bold text-[#1F2937] mt-1">"{story.title}"</h4>
                          <p className="text-[10px] text-[#6B7280] font-sans font-medium">Regret Score: {story.regretScore}/10 • Votes: {story.helpfulVotes}</p>
                        </div>
                        <span className="text-[10px] text-[#C9A227] font-bold hover:underline">View Post</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Stories Folder */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] flex items-center gap-1.5 font-mono">
                  <Bookmark className="h-4 w-4 text-[#24324A]" /> Saved Outcome Chronicles ({bookmarkedStories.length})
                </h3>

                {bookmarkedStories.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-400 border border-dashed border-[#E5E7EB] rounded-xl bg-[#FAF8F2] font-semibold">
                    <Bookmark className="h-6 w-6 mb-1 text-zinc-400" />
                    <p className="text-xs text-zinc-500">Your bookmarks folder is empty.</p>
                    <p className="text-[10px] text-zinc-400">Save timeline stories of other users to review their post-decision advice later.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {bookmarkedStories.map(story => (
                      <div
                        key={story.id}
                        onClick={() => setScreen({ type: 'situation', slug: story.situationSlug })}
                        className="rounded-lg border border-[#E5E7EB] bg-[#FAF8F2] p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-[#24324A]/60 transition-all font-serif italic shadow-2xs"
                      >
                        <div>
                          <span className="text-[9px] uppercase font-bold text-[#24324A] bg-[#24324A]/5 px-1.5 py-0.5 rounded font-sans border border-[#24324A]/10">
                            {story.situationName}
                          </span>
                          <h4 className="text-xs font-bold text-[#1F2937] mt-1">"{story.title}"</h4>
                          <p className="text-[10px] text-[#6B7280] font-sans font-medium">By @{story.userName} • Regret Score: {story.regretScore}/10</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveBookmark(story.id);
                          }}
                          className="text-[10px] font-bold text-[#C0392B] bg-red-50 hover:bg-red-100 border border-red-100 px-2.5 py-1.5 rounded transition-colors shadow-2xs shrink-0"
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
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-5 space-y-4 animate-fadeIn shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] font-mono">Advice Responses Received</h3>
            <p className="text-[10px] text-[#6B7280] mt-0.5 font-semibold">Review mentoring advices, logic breakdowns, and peer experiences wrote on your timeline logs.</p>
          </div>

          {receivedComments.length === 0 ? (
            <div className="py-12 border border-dashed border-[#E5E7EB] rounded-xl text-center text-zinc-400 space-y-2 bg-[#FAF8F2] font-semibold">
              <MessageCircle className="h-8 w-8 mx-auto text-zinc-300" />
              <p className="text-xs font-bold text-zinc-500">Your Responses Inbox is currently silent.</p>
              <p className="text-[10px] text-zinc-400 max-w-sm mx-auto">
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
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] space-y-3 hover:border-[#24324A]/40 transition-all cursor-pointer shadow-2xs"
                    onClick={() => {
                      if (sourceStory) {
                        setScreen({ type: 'situation', slug: sourceStory.situationSlug });
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2 font-semibold">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-extrabold text-[#1F2937]">@{comment.authorName}</span>
                        <span className="text-[#6B7280]">replied on your outcome story</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{comment.dateAdded}</span>
                    </div>

                    <div className="space-y-2">
                      {sourceStory && (
                        <div className="text-[10px] text-[#24324A] bg-[#24324A]/5 border border-[#24324A]/10 px-2.5 py-1 rounded-md inline-block font-sans font-bold">
                          Story Reference: "{sourceStory.title}"
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-[#374151] font-serif italic whitespace-pre-wrap pl-1">
                        "{comment.text}"
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#C9A227] font-bold hover:underline">
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
