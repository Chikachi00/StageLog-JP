import { VenueMap } from "../components/VenueMap";
import { venues } from "../data/venues";

export function Venues() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Venues</h1>
      </header>
      <section className="venue-grid">
        {venues.map((venue) => (
          <article className="venue-card" key={venue.id}>
            <VenueMap venue={venue} />
            <dl>
              <div>
                <dt>Capacity</dt>
                <dd>{venue.capacity.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Access</dt>
                <dd>{venue.access}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}
