import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100">
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <SignIn />
      </div>
    </div>
  );
}