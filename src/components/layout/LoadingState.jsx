import React from 'react';

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-axim-emerald border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-gray-500">{message}</p>
    </div>
  );
}
