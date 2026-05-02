import React from 'react';

const AdminPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
    <h2 className="text-2xl font-black text-slate-900 mb-2">{title}</h2>
    <p className="font-medium">This section is currently under construction.</p>
  </div>
);

export const AdminAttempts = () => <AdminPlaceholder title="Attempts Manager" />;
export const AdminAnalytics = () => <AdminPlaceholder title="System Analytics" />;
export const AdminSettings = () => <AdminPlaceholder title="Admin Settings" />;
