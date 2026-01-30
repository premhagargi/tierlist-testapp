export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-[#0E1113] text-white">
      <div className="relative w-14 h-14">
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-white animate-spin"></div>
      </div>
    </div>
  );
};
