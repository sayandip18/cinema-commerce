import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-6">
        <h1 className="text-xl font-semibold text-gray-900">Cinema Admin</h1>
        <nav className="flex gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`
            }
          >
            Inventory
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`
            }
          >
            Dashboard
          </NavLink>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
