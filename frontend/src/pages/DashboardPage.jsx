import React, { useEffect, useMemo, useState } from "react";
import ResumeUpload from "../components/ResumeUpload";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  FileText,
  Settings,
  LogOut,
  Search,
  Bell,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Activity,
  Brain,
  ShieldCheck,
  Star,
  X,
  Eye,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const pieColors = ["#7c3aed", "#06b6d4", "#f59e0b", "#ef4444"];

function Ring({ value, label, color = "#22d3ee" }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const score = Math.max(0, Math.min(100, Number(value) || 0));
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg className="block rotate-[-90deg]" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="314"
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-cyan-300">
          {score.toFixed(2)}%
        </span>
        <span className="text-xs text-white/40">{label}</span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = (status || "").toLowerCase();

  const classes =
    normalized === "shortlist"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
      : normalized === "hold"
      ? "bg-amber-500/15 text-amber-300 border-amber-400/20"
      : "bg-rose-500/15 text-rose-300 border-rose-400/20";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${classes}`}
    >
      {status || "N/A"}
    </span>
  );
}

export default function DashboardPage({
   jobDescription,
   setJobDescription
}) {
  const { logout } = useAuth();

  const [summary, setSummary] = useState({
    applications: 0,
    shortlisted: 0,
    hold: 0,
    rejected: 0,
  });
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchSummary = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/reports/summary");
        const data = await res.json();
        if (!mounted) return;

        setSummary({
          applications: Number(data.applications ?? 0),
          shortlisted: Number(data.shortlisted ?? 0),
          hold: Number(data.hold ?? data.onhold ?? 0),
          rejected: Number(data.rejected ?? 0),
        });

        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.log("Summary fetch error:", err);
      }
    };

    const fetchCandidates = async () => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/candidates");
    const data = await res.json();

    console.log("ALL CANDIDATES =", data);

    if (!mounted) return;
    setCandidates(Array.isArray(data) ? data : []);
  } catch (err) {
    console.log("Candidates fetch error:", err);
  }
};

    fetchSummary();
    fetchCandidates();

    const interval = setInterval(() => {
      fetchSummary();
      fetchCandidates();
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const computedSummary = useMemo(() => {
    const shortlisted = candidates.filter(
      (c) => (c.decision || "").toLowerCase() === "shortlist"
    ).length;
    const hold = candidates.filter(
      (c) => (c.decision || "").toLowerCase() === "hold"
    ).length;
    const rejected = candidates.filter(
      (c) => (c.decision || "").toLowerCase() === "reject"
    ).length;

    return {
      applications: candidates.length,
      shortlisted,
      hold,
      rejected,
    };
  }, [candidates]);

  const displaySummary = useMemo(
    () => ({
      applications: summary.applications || computedSummary.applications,
      shortlisted: summary.shortlisted || computedSummary.shortlisted,
      hold: summary.hold || computedSummary.hold,
      rejected: summary.rejected || computedSummary.rejected,
    }),
    [summary, computedSummary]
  );

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const decision = (c.decision || "").toLowerCase();
      const score = Number(c.score || 0);

      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || decision === statusFilter;

      const matchesScore =
        scoreFilter === "all"
          ? true
          : scoreFilter === "90+"
          ? score >= 90
          : scoreFilter === "70-89"
          ? score >= 70 && score < 90
          : score < 70;

      return matchesSearch && matchesStatus && matchesScore;
    });
  }, [candidates, searchTerm, statusFilter, scoreFilter]);

  const rankedCandidates = useMemo(() => {
    return [...filteredCandidates]
      .sort((a, b) => {
        const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.name || "").localeCompare(b.name || "");
      })
      .map((c, index) => ({
        ...c,
        rank: index + 1,
      }));
  }, [filteredCandidates]);

  const topScore = rankedCandidates[0]?.score ?? 0;
  const averageScore = useMemo(() => {
    if (!rankedCandidates.length) return 0;
    const total = rankedCandidates.reduce(
      (sum, c) => sum + Number(c.score || 0),
      0
    );
    return total / rankedCandidates.length;
  }, [rankedCandidates]);

  const chartData = [
    { name: "Applications", value: displaySummary.applications },
    { name: "Shortlisted", value: displaySummary.shortlisted },
    { name: "Hold", value: displaySummary.hold },
    { name: "Rejected", value: displaySummary.rejected },
  ];

  const pieData = [
    { name: "Shortlisted", value: displaySummary.shortlisted },
    { name: "Hold", value: displaySummary.hold },
    { name: "Rejected", value: displaySummary.rejected },
    { name: "Applications", value: displaySummary.applications },
  ];

  const stats = [
    {
      title: "Applications",
      value: displaySummary.applications,
      change: "+5%",
      icon: FileText,
      glow: "from-pink-500 to-fuchsia-500",
    },
    {
      title: "Shortlisted",
      value: displaySummary.shortlisted,
      change: "+14%",
      icon: CheckCircle2,
      glow: "from-cyan-500 to-sky-500",
    },
    {
      title: "Hold",
      value: displaySummary.hold,
      change: "-4%",
      icon: Bell,
      glow: "from-amber-500 to-orange-500",
    },
    {
      title: "Rejected",
      value: displaySummary.rejected,
      change: "+8%",
      icon: TrendingUp,
      glow: "from-red-500 to-pink-500",
    },
  ];

  const recentCandidates = useMemo(() => {
    return [...candidates].slice(-4).reverse();
  }, [candidates]);

  const topSkills = useMemo(() => {
  if (!candidates.length) return [];

  const latestCandidate = candidates[candidates.length - 1];

  return latestCandidate.job_matching?.required_skills_found || [];
}, [candidates]);

  const alerts = [
    "New resumes are being processed live.",
    "Candidate scores update automatically.",
    "Shortlist and hold counts refresh every few seconds.",
  ];

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Score", "Decision", "Skills", "Date"];
    const rows = rankedCandidates.map((c) => [
      c.name || "N/A",
      c.email || "N/A",
      Number(c.score || 0).toFixed(2),
      c.decision || "N/A",
      Array.isArray(c.skills) ? c.skills.join(" | ") : "N/A",
      c.date || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "resume_ranker_candidates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCandidateOpen = (candidate) => {
    setSelectedCandidate(candidate);
  };

  return (
    <div className="min-h-screen bg-[#070b18] text-white overflow-hidden">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-[300px] flex-col border-r border-white/10 bg-[#090f1f]/90 backdrop-blur-2xl p-5">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30">
              R
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Resume Rank AI
              </h1>
              <p className="text-xs text-white/50">AI Hiring Assistant</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              ["Dashboard", LayoutDashboard],
              ["Upload Resume", UploadCloud],
              ["Candidates", Users],
              ["Reports", FileText],
              ["Settings", Settings],
              ["Logout", LogOut],
            ].map(([label, Icon], i) => (
              <button
                key={label}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  i === 0
                    ? "bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/20 text-white border border-white/10"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-500/10 p-5 shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles size={16} />
              <p className="text-sm font-medium">Go Premium</p>
            </div>
            <h3 className="mt-3 text-xl font-semibold">
              Unlock advanced insights
            </h3>
            <p className="mt-2 text-sm text-white/60">
              AI matching, smarter analytics, and premium screening tools.
            </p>
            <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 text-sm font-semibold hover:opacity-90 transition">
              Upgrade Now
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 xl:p-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5 md:p-6 shadow-2xl shadow-black/20 mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-white/50 text-sm">Welcome back,</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Recruitment Dashboard
                  </h2>
                  <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                    <Activity size={12} />
                    Live AI • {lastUpdated || "updating..."}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/60 w-[360px]">
                  <Search size={18} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm placeholder:text-white/35"
                    placeholder="Search candidate or role..."
                  />
                </div>
                <button className="rounded-2xl bg-white/5 p-3 hover:bg-white/10 transition border border-white/10">
                  <Bell size={18} />
                </button>
                <button
                  onClick={logout}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm hover:bg-white/15 transition flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-6">
            <section className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-indigo-600/20 via-fuchsia-500/10 to-cyan-500/15 p-6 md:p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_30%)]" />
                <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                      <Brain size={12} />
                      Smart Resume Screening System
                    </div>
                    <h3 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
                      Make hiring faster, cleaner, and more intelligent.
                    </h3>
                    <p className="mt-4 max-w-2xl text-white/70">
                      Upload resumes, analyze candidate fit, and visualize ranking scores with a premium AI dashboard experience.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button className="rounded-2xl bg-white text-[#0b1020] px-5 py-3 text-sm font-semibold hover:scale-[1.02] transition">
                        Upload Resume
                      </button>
                      <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition">
                        View Reports
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs text-white/45">AI Match Rate</p>
                      <div className="mt-4 flex items-center justify-center">
                        <Ring value={topScore} label="match" color="#22d3ee" />
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs text-white/45">Average Score</p>
                      <div className="mt-4 flex items-center justify-center">
                        <Ring value={averageScore} label="avg" color="#ec4899" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {stats.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-xl shadow-black/20"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-white/55">{item.title}</p>
                          <h3 className="mt-2 text-3xl font-bold">{item.value}</h3>
                        </div>
                        <div
                          className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${
                            idx === 0
                              ? "from-pink-500 to-fuchsia-500"
                              : idx === 1
                              ? "from-cyan-500 to-sky-500"
                              : idx === 2
                              ? "from-amber-500 to-orange-500"
                              : "from-red-500 to-pink-500"
                          } border border-white/10 flex items-center justify-center`}
                        >
                          <Icon size={20} />
                        </div>
                      </div>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                        <TrendingUp size={14} />
                        {item.change} this month
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">Upload Resume</h3>
                      <p className="text-sm text-white/45">
                        Upload PDF, DOCX, or image resumes and get extracted details instantly.
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                      <UploadCloud size={20} />
                    </div>
                  </div>

                <ResumeUpload jobDescription={jobDescription} />
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-xl shadow-black/20">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-2xl font-bold">Live Match Overview</h2>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-3xl bg-gradient-to-r from-indigo-500/20 via-cyan-500/10 to-fuchsia-500/20 border border-white/10 p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                          <p className="text-sm text-white/40">Top Candidate Score</p>
                          <h3 className="mt-1 text-4xl font-bold text-cyan-300">
                            {Number(topScore || 0).toFixed(2)}%
                          </h3>
                          <p className="mt-2 text-white/60">
                            Highest live match among parsed candidates.
                          </p>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                          <div className="relative h-28 w-28">
                            <svg className="rotate-[-90deg]" viewBox="0 0 120 120">
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="10"
                                fill="none"
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                stroke="#22d3ee"
                                strokeWidth="10"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="314"
                                strokeDashoffset={314 - (Number(topScore || 0) / 100) * 314}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-cyan-300">
                                {Number(topScore || 0).toFixed(2)}%
                              </span>
                              <span className="text-xs text-white/40">Match Score</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Top Skills Seen</h3>
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300 border border-cyan-400/20">
                          Live
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
  {topSkills.map((skill) => (
    <span
      key={skill}
      className="rounded-full bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-200 border border-indigo-400/20"
    >
      {skill}
    </span>
  ))}
</div>
</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                        <p className="text-sm text-white/40">Resume Status</p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-300 border border-emerald-400/20">
                          <CheckCircle2 className="h-4 w-4" />
                          Successfully Parsed
                        </div>
                      </div>

                      <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                        <p className="text-sm text-white/40">AI Status</p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-cyan-300 border border-cyan-400/20">
                          <Star className="h-4 w-4" />
                          AI Matching Enabled
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-xl shadow-black/20">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-semibold">Candidate History</h3>
                    <p className="text-sm text-white/45">
                      Live candidates from backend
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Search by name/email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                    />

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none"
                    >
                      <option value="all">All</option>
                      <option value="shortlist">Shortlist</option>
                      <option value="hold">Hold</option>
                      <option value="reject">Reject</option>
                    </select>

                    <select
                      value={scoreFilter}
                      onChange={(e) => setScoreFilter(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none"
                    >
                      <option value="all">All Scores</option>
                      <option value="90+">90+</option>
                      <option value="70-89">70-89</option>
                      <option value="below70">Below 70</option>
                    </select>

                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm hover:bg-white/15 transition"
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/50 border-b border-white/10">
                        <th className="py-3 pr-4">Name</th>
                        <th className="py-3 pr-4">Email</th>
                        <th className="py-3 pr-4">Score</th>
                        <th className="py-3 pr-4">Decision</th>
                        <th className="py-3 pr-4">Skills</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedCandidates.length > 0 ? (
                        rankedCandidates.map((c, index) => (
                          <tr
                            key={`${c.email || c.name || index}-${index}`}
                            className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                            onClick={() => setSelectedCandidate(c)}
                          >
                            <td className="py-4 pr-4 font-medium">
                              {c.name || "N/A"}
                            </td>
                            <td className="py-4 pr-4 text-white/70">
                              {c.email || "N/A"}
                            </td>
                            <td className="py-4 pr-4 font-semibold">
                              {Number(c.score || 0).toFixed(2)}%
                            </td>
                            <td className="py-4 pr-4">
                              <StatusPill status={c.decision} />
                            </td>
                            <td className="py-4 pr-4 text-white/60">
                              {Array.isArray(c.skills) && c.skills.length > 0
                                ? c.skills.slice(0, 3).join(", ")
                                : "N/A"}
                            </td>
                            <td className="py-4 pr-4 text-white/50">
                              {c.date || "-"}
                            </td>
                            <td className="py-4 pr-4">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15 transition"
                              >
                                <Eye size={12} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="py-10 text-center text-white/45"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <p className="text-lg font-medium">
                                No candidates found
                              </p>
                              <p className="text-sm text-white/30">
                                Try changing filters or upload a new resume.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-semibold">Live Hiring Summary</h3>
                    <p className="text-sm text-white/45">
                      Auto-updated from backend every few seconds
                    </p>
                  </div>
                  <div className="text-sm text-cyan-300">Live</div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                        />
                        <XAxis dataKey="name" stroke="#8aa0c7" />
                        <YAxis stroke="#8aa0c7" />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(10,15,30,0.95)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "16px",
                            color: "#fff",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          dot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={4}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={pieColors[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "rgba(10,15,30,0.95)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "16px",
                            color: "#fff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-xl shadow-black/20">
                <h3 className="text-xl font-semibold mb-4">Live Alerts</h3>
                <div className="space-y-3">
                  {alerts.map((item) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl bg-black/20 p-3 border border-white/5"
                    >
                      <div className="h-9 w-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                        <Sparkles size={16} className="text-cyan-300" />
                      </div>
                      <p className="text-sm text-white/70">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              
            </aside>
          </div>

          {selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0b1020] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Candidate Details</h2>
                    <p className="text-sm text-white/45">
                      Full parsed information
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="rounded-2xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition inline-flex items-center gap-2"
                  >
                    <X size={16} />
                    Close
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/40">Name</p>
                    <p className="mt-1 text-lg font-semibold">
                      {selectedCandidate.name || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/40">Email</p>
                    <p className="mt-1 text-lg font-semibold">
                      {selectedCandidate.email || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/40">Score</p>
                    <p className="mt-1 text-lg font-semibold">
                      {Number(selectedCandidate.score || 0).toFixed(2)}%
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/40">Decision</p>
                    <p className="mt-1 text-lg font-semibold capitalize">
                      {selectedCandidate.decision || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/40 mb-3">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(selectedCandidate.skills) &&
                    selectedCandidate.skills.length > 0 ? (
                      selectedCandidate.skills.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-200 border border-indigo-400/20"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/50">No skills found</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/40">Date</p>
                  <p className="mt-1 text-lg font-semibold">
                    {selectedCandidate.date || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
