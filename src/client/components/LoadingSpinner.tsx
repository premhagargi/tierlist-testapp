type LoadingSpinnerProps = {
  size?: number;
  /** Centers the spinner within a modest container (use for list/section loaders) */
  centered?: boolean;
  /** Renders a full-screen overlay with a centered spinner (use for page-level loading) */
  overlay?: boolean;
};

export const LoadingSpinner = ({
  size = 32,
  centered = false,
  overlay = false,
}: LoadingSpinnerProps) => {
  const border = Math.max(2, Math.floor(size / 8));

  const spinner = (
    <div
      className="inline-block animate-spin rounded-full border-t-white border-l-white border-r-transparent border-b-transparent"
      style={{ width: size, height: size, borderWidth: border }}
      role="status"
      aria-label="Loading"
    />
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        {spinner}
      </div>
    );
  }

  if (centered) {
    return <div className="flex items-center justify-center w-full py-8 text-white">{spinner}</div>;
  }

  return spinner;
};
