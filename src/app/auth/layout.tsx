export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Organizer</h1>
            <p className="text-slate-400 text-sm mt-2">
              Master your tasks, level up your life
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
