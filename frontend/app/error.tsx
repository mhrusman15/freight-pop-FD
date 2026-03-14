 'use client';

 import React, { useEffect } from 'react';

 export default function Error({
   error,
   reset,
 }: {
   error: Error & { digest?: string };
   reset: () => void;
 }) {
   useEffect(() => {
     console.error(error);
   }, [error]);

   return (
     <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
       <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 space-y-4">
         <h1 className="text-xl font-semibold text-red-600">Something went wrong</h1>
         <p className="text-sm text-gray-700">
           {error.message || 'An unexpected error occurred.'}
         </p>
         <button
           type="button"
           onClick={() => reset()}
           className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
         >
           Try again
         </button>
       </div>
     </div>
   );
 }

