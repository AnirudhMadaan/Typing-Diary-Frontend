import React from 'react';
import { X, ShieldCheck, Mail, Lock, BookOpen } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E3DCCF] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE4DC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2B2621] text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#24201C]">
                Terms & Conditions and Privacy Policy
              </h2>
              <p className="text-[11px] text-[#8A7969]">Last revised: October 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Terms"
            className="p-1.5 rounded-lg text-[#8A7969] hover:text-[#24201C] hover:bg-[#EFEAE2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs text-[#51463A] leading-relaxed pr-1 font-sans">
          <section className="space-y-1.5">
            <h3 className="font-serif-display text-sm font-semibold text-[#24201C] flex items-center gap-1.5">
              <span>1. Welcome to Typing Diary</span>
            </h3>
            <p>
              Typing Diary is a digital sanctuary engineered for intentional, focused writing with tactile typewriter aesthetics.
              By creating an account, you agree to these Terms and Conditions in full.
            </p>
          </section>

          <section className="space-y-1.5 bg-[#FAF4EB] p-3.5 rounded-xl border border-[#E8DEC8]">
            <h3 className="font-serif-display text-sm font-semibold text-[#2B2621] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#8C765E]" />
              <span>2. Sacred Privacy of Private Diaries</span>
            </h3>
            <p className="text-[#4A3E33]">
              Your private journal entries belong strictly to you. Platform administrators, staff, and third parties
              <strong> cannot inspect, read, browse, or export the contents or titles of your private diary entries</strong>.
              Administrators only monitor high-level system usage aggregates (such as total word count written) to ensure platform stability.
            </p>
          </section>

          <section className="space-y-1.5 bg-[#F6F8F4] p-3.5 rounded-xl border border-[#D5E2D0]">
            <h3 className="font-serif-display text-sm font-semibold text-[#2D4522] flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#4E773E]" />
              <span>3. Mandatory Email Updates Opt-In</span>
            </h3>
            <p className="text-[#364A2F]">
              To maintain an active, secure, and authentic community of writers, opt-in to platform email updates is
              <strong> mandatory for account creation</strong>. By registering, you agree to receive essential service announcements,
              security notices, product improvements, and founder letters dispatched from our official email address.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-serif-display text-sm font-semibold text-[#24201C] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8C765E]" />
              <span>4. Public Community Standards</span>
            </h3>
            <p>
              When you choose to publish an entry to the Community Blog, you grant fellow readers permission to read, reflect upon,
              and react to your words. Harassment, spam, illicit content, or abusive writing in public spaces is strictly prohibited
              and subject to immediate administrative moderation or removal.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-serif-display text-sm font-semibold text-[#24201C]">
              <span>5. Intellectual Property & Your Words</span>
            </h3>
            <p>
              You retain 100% ownership and copyright of everything you write on Typing Diary. You can export your journal at any time
              in Markdown or JSON formats, or permanently delete your account and all associated entries whenever you wish.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-[#EAE4DC] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2B2621] hover:bg-[#403932] text-[#FAF8F5] text-xs font-semibold rounded-xl transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
