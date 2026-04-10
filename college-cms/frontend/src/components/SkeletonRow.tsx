import React from 'react';

const SkeletonRow = ({ columns }: { columns: number }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </td>
      ))}
    </tr>
  );
};

export default SkeletonRow;
