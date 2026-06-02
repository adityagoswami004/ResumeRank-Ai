import React from 'react';
import { User, Mail, Wrench, Briefcase, GraduationCap, Award, Calendar, Building2 } from 'lucide-react';

const MOCK_DATA = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+1 (555) 123-4567',
  skills: ['React.js', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL'],
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      duration: 'Jan 2021 - Present',
      description: 'Leading frontend development team, architecting scalable React applications'
    },
    {
      title: 'Software Developer',
      company: 'StartupXYZ',
      duration: 'Jun 2018 - Dec 2020',
      description: 'Developed full-stack web applications using MERN stack'
    }
  ],
  education: [
    {
      degree: 'Master of Science in Computer Science',
      institution: 'Stanford University',
      year: '2018'
    },
    {
      degree: 'Bachelor of Technology',
      institution: 'MIT',
      year: '2016'
    }
  ],
  certifications: ['AWS Certified Solutions Architect', 'MongoDB Certified Developer']
};

function InfoCard({ icon: Icon, title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ParsedOutput({ data }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <Briefcase className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No parsed data yet</p>
        <p className="text-sm">Upload a resume to see parsed results here</p>
      </div>
    );
  }

  const profile = data.candidate_profile || {};
  const skills = data.matched_skills || [];
  const experience = data.experience || [];
  const education = data.education || [];
  const certifications = data.certifications || [];
  const matching = data.job_matching || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Parsed Output</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Extracted candidate information</p>
      </div>

      {/* Matching Score */}
{matching.final_recommendation_score && (
  <div className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 border-primary-200 dark:border-primary-800 overflow-visible">
    
    <div className="flex items-center justify-between gap-6 flex-wrap">
      
      {/* LEFT INFO */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Final Recommendation Score
        </p>

        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Skill Overlap: {matching.skill_overlap_score}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Semantic Match: {matching.semantic_match_score}
          </p>
        </div>
      </div>

      {/* RIGHT CIRCLE */}
      <div className="relative w-28 h-28 shrink-0">
        <svg className="w-28 h-28 rotate-[-90deg]" viewBox="0 0 120 120">
          
          {/* Background */}
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="10"
            fill="none"
          />

          {/* Progress */}
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="url(#gradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(parseFloat(matching.final_recommendation_score) || 0) * 3.14} 314`}
          />

          <defs>
            <linearGradient id="gradient">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        {/* CENTER TEXT */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">
              {matching.final_recommendation_score}
            </p>

            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Match
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={User} title="Personal Information">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.name || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{profile.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{profile.phone || 'N/A'}</span>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={Wrench} title="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? skills.map(skill => (
              <span
                key={skill}
                className="px-3 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 text-sm font-medium rounded-full"
              >
                {skill}
              </span>
            )) : <p className="text-sm text-gray-500">No skills extracted</p>}
          </div>
        </InfoCard>
      </div>

      {/* Experience */}
      <InfoCard icon={Building2} title="Work Experience">
        <div className="space-y-4">
          {experience.length > 0 ? experience.map((exp, idx) => (
            <div key={idx} className="border-l-2 border-primary-200 dark:border-primary-800 pl-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h4 className="font-medium text-gray-900 dark:text-white">{exp.title || 'Role'}</h4>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {exp.duration || 'N/A'}
                </div>
              </div>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{exp.company || 'Company'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exp.description || ''}</p>
            </div>
          )) : <p className="text-sm text-gray-500">No experience extracted</p>}
        </div>
      </InfoCard>

      {/* Education */}
      <InfoCard icon={GraduationCap} title="Education">
        <div className="space-y-3">
          {education.length > 0 ? education.map((edu, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{edu.degree || 'Degree'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{edu.institution || 'Institution'}</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{edu.year || ''}</span>
            </div>
          )) : <p className="text-sm text-gray-500">No education extracted</p>}
        </div>
      </InfoCard>

      {/* Certifications */}
      {certifications.length > 0 && (
        <InfoCard icon={Award} title="Certifications">
          <div className="flex flex-wrap gap-2">
            {certifications.map(cert => (
              <span
                key={cert}
                className="px-3 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm font-medium rounded-full flex items-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                {cert}
              </span>
            ))}
          </div>
        </InfoCard>
      )}
    </div>
  );
}

