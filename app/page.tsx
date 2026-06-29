import GrcLab from "./grc-lab";

export default function Home() {
  return (
    <>
      <a
        className="fixed right-4 top-4 z-50 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50"
        href="/banking-iam"
      >
        Banking IAM
      </a>
      <GrcLab />
    </>
  );
}
