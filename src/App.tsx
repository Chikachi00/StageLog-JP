import { useState } from "react";
import { Events } from "./pages/Events";
import { Home } from "./pages/Home";
import { Statistics } from "./pages/Statistics";
import { Venues } from "./pages/Venues";

type Page = "home" | "events" | "statistics" | "venues";

const pages: Array<{ id: Page; label: string }> = [
  { id: "home", label: "Home" },
  { id: "events", label: "Events" },
  { id: "statistics", label: "Statistics" },
  { id: "venues", label: "Venues" },
];

function renderPage(page: Page) {
  switch (page) {
    case "events":
      return <Events />;
    case "statistics":
      return <Statistics />;
    case "venues":
      return <Venues />;
    default:
      return <Home />;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <span>StageLog JP</span>
        <div>
          {pages.map((item) => (
            <button
              className={page === item.id ? "is-active" : undefined}
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      {renderPage(page)}
    </div>
  );
}
