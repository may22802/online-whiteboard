// "use client";

// import { Authenticated, Unauthenticated } from "convex/react";
// import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
// import { useState } from "react";

// export default function Home() {
//   return (
//     <>
//       <Authenticated>
//         <AuthenticatedView />
//       </Authenticated>
//       <Unauthenticated>
//         <LandingPage />
//       </Unauthenticated>
//     </>
//   );
// }

// function LandingPage() {
//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
//       <div className="text-center">
//         <h1 className="text-4xl font-bold text-gray-900 mb-4">
//           Welcome to the Online Whiteboard
//         </h1>
//         <p className="text-lg text-gray-600 mb-8">
//           Collaborate and create amazing drawings together.
//         </p>
//         <div className="space-x-4">
//           <SignInButton mode="modal">
//             <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
//               Log in
//             </button>
//           </SignInButton>
//           <SignUpButton mode="modal">
//             <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
//               Sign up
//             </button>
//           </SignUpButton>
//         </div>
//       </div>
//     </div>
//   );
// }

// function AuthenticatedView() {
//   const [showDashboard, setShowDashboard] = useState(false);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <header className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-4">
//             <h1 className="text-xl font-semibold text-gray-900">
//               Online Whiteboard
//             </h1>
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => setShowDashboard(true)}
//                 className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
//               >
//                 Dashboard
//               </button>
//               <UserButton />
//             </div>
//           </div>
//         </div>
//       </header>
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {showDashboard ? (
//           <div className="text-center">
//             <h2 className="text-2xl font-bold text-gray-900 mb-4">
//               Authenticated user only
//             </h2>
//           </div>
//         ) : (
//           <div className="text-center">
//             <p className="text-gray-600">Welcome back! Click Dashboard to view authenticated content.</p>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Authenticated>
        <AuthenticatedView />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}

// ... LandingPage stays the same ...

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to the Online Whiteboard
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Collaborate and create amazing drawings together.
        </p>
        <div className="space-x-4">
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
              Log in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
              Sign up
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedView() {
// 2. Initialize router

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Online Whiteboard
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Dashboard
                </button>
              </Link>
              <UserButton />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">
            Welcome back! Click Dashboard to enter your workspace.
          </p>
        </div>
      </main>
    </div>
  );
}
