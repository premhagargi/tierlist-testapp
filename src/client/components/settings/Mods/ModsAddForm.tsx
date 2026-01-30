import { FormEvent } from 'react';
import { Plus } from 'lucide-react';

interface ModsAddFormProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
}

export const ModsAddForm = ({
  username,
  onUsernameChange,
  onSubmit,
  submitting = false,
}: ModsAddFormProps) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
    <input
      type="text"
      value={username}
      onChange={(event) => onUsernameChange(event.target.value)}
      placeholder="Enter Reddit User name (eg: user123 if user name is u/user123)"
      className="flex-1 rounded-lg border border-[#5D6263] bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#648EFC] focus:outline-none focus:ring-0 cursor-text"
    />

    <button
      type="submit"
      disabled={submitting || !username.trim()}
      className="allow-white-bg inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition disabled:cursor-wait disabled:opacity-70 cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      {submitting ? 'Adding…' : 'Add'}
    </button>
  </form>
);
