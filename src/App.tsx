import { useMemo, useState } from "react";
import { EventForm } from "./components/EventForm";
import { EventList } from "./components/EventList";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import type { AppView } from "./components/Header";
import { Statistics } from "./components/Statistics";
import { TicketManager } from "./components/TicketManager";
import { Timeline } from "./components/Timeline";
import { VenuesPage } from "./components/VenuesPage";
import { createSampleEvents } from "./data/sampleEvents";
import { getVenueById, venues } from "./data/venues";
import { addEvent, deleteEvent, getEvents, saveEvents, updateEvent } from "./services/eventStorage";
import {
  addTicketApplication,
  deleteTicketApplication,
  getTicketApplications,
  updateTicketApplication,
} from "./services/ticketStorage";
import { fetchWeatherForEvent } from "./services/weatherService";
import type { EventFilters, EventFormValues, EventRecord } from "./types/event";
import type { AppTheme } from "./types/theme";
import { isAppTheme, THEME_STORAGE_KEY } from "./types/theme";
import type { TicketApplication, TicketApplicationFormValues } from "./types/ticket";
import { getEventYear, sortByDateDesc } from "./utils/dateUtils";

const defaultFilters: EventFilters = {
  year: "all",
  artist: "all",
  venue: "all",
  search: "",
};

const getInitialTheme = (): AppTheme => {
  if (typeof window === "undefined") {
    return "sakura";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(savedTheme) ? savedTheme : "sakura";
};

const createRecord = (values: EventFormValues, editingEvent?: EventRecord | null): EventRecord => {
  const venue = getVenueById(values.venueId);

  if (!venue) {
    throw new Error("Venue is required.");
  }

  const now = new Date().toISOString();

  return {
    id: editingEvent?.id ?? crypto.randomUUID(),
    title: values.title,
    artist: values.artist,
    date: values.date,
    startTime: values.startTime,
    venueId: venue.id,
    venueName: venue.name,
    city: venue.city,
    country: venue.country,
    ticketType: values.ticketType,
    seat: values.seat,
    imageUrl: values.imageUrl || undefined,
    weather: editingEvent?.weather,
    notes: values.notes,
    createdAt: editingEvent?.createdAt ?? now,
    updatedAt: now,
  };
};

const createTicketApplication = (
  values: TicketApplicationFormValues,
  editingApplication?: TicketApplication | null,
): TicketApplication => {
  const venue = getVenueById(values.venueId);
  const now = new Date().toISOString();

  return {
    id: editingApplication?.id ?? crypto.randomUUID(),
    eventTitle: values.eventTitle,
    artist: values.artist,
    venueId: venue?.id,
    venueName: venue?.name,
    city: venue?.city,
    country: venue?.country,
    eventDate: values.eventDate || undefined,
    platform: values.platform,
    applicationDate: values.applicationDate || undefined,
    resultDate: values.resultDate || undefined,
    paymentDeadline: values.paymentDeadline || undefined,
    issueDate: values.issueDate || undefined,
    status: values.status,
    ticketType: values.ticketType || undefined,
    price: values.price ? Number(values.price) : undefined,
    quantity: values.quantity ? Number(values.quantity) : undefined,
    companionName: values.companionName || undefined,
    companionContact: values.companionContact || undefined,
    memo: values.memo || undefined,
    linkedEventId: editingApplication?.linkedEventId,
    createdAt: editingApplication?.createdAt ?? now,
    updatedAt: now,
  };
};

const getUniqueSorted = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

function App() {
  const [events, setEvents] = useState<EventRecord[]>(() => sortByDateDesc(getEvents()));
  const [ticketApplications, setTicketApplications] = useState<TicketApplication[]>(() =>
    getTicketApplications(),
  );
  const [activeView, setActiveView] = useState<AppView>("events");
  const [theme, setTheme] = useState<AppTheme>(() => getInitialTheme());
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [editingApplication, setEditingApplication] = useState<TicketApplication | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  const [fetchingWeatherId, setFetchingWeatherId] = useState<string | null>(null);
  const [weatherErrors, setWeatherErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string>("");

  const filterOptions = useMemo(
    () => ({
      years: getUniqueSorted(events.map((event) => getEventYear(event.date))).sort((a, b) => b.localeCompare(a)),
      artists: getUniqueSorted(events.map((event) => event.artist)),
      venues: getUniqueSorted(events.map((event) => event.venueName)),
    }),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesYear = filters.year === "all" || getEventYear(event.date) === filters.year;
      const matchesArtist = filters.artist === "all" || event.artist === filters.artist;
      const matchesVenue = filters.venue === "all" || event.venueName === filters.venue;
      const matchesSearch =
        !search ||
        [event.title, event.artist, event.venueName].some((value) => value.toLowerCase().includes(search));

      return matchesYear && matchesArtist && matchesVenue && matchesSearch;
    });
  }, [events, filters]);

  const refreshEvents = () => {
    setEvents(sortByDateDesc(getEvents()));
  };

  const refreshTicketApplications = () => {
    setTicketApplications(getTicketApplications());
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
  };

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    setNotice("");

    if (view === "add") {
      setEditingEvent(null);
    }
  };

  const handleSaveEvent = (values: EventFormValues) => {
    try {
      const record = createRecord(values, editingEvent);

      if (editingEvent) {
        updateEvent(record);
        setNotice("Event updated.");
      } else {
        addEvent(record);
        setNotice("Event saved.");
      }

      setEditingEvent(null);
      refreshEvents();
      setActiveView("events");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save event.");
    }
  };

  const handleSaveTicketApplication = (
    values: TicketApplicationFormValues,
    currentEditingApplication?: TicketApplication | null,
  ) => {
    try {
      const application = createTicketApplication(values, currentEditingApplication);

      if (currentEditingApplication) {
        updateTicketApplication(application);
        setNotice("Ticket application updated.");
      } else {
        addTicketApplication(application);
        setNotice("Ticket application saved.");
      }

      setEditingApplication(null);
      refreshTicketApplications();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save ticket application.");
    }
  };

  const handleEdit = (event: EventRecord) => {
    setEditingEvent(event);
    setActiveView("add");
    setNotice("");
  };

  const handleDelete = (id: string) => {
    const event = events.find((item) => item.id === id);
    const confirmed = window.confirm(`Delete "${event?.title ?? "this event"}"?`);

    if (!confirmed) {
      return;
    }

    deleteEvent(id);
    setWeatherErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    refreshEvents();
    setNotice("Event deleted.");
  };

  const handleFetchWeather = async (event: EventRecord) => {
    const venue = getVenueById(event.venueId);
    setFetchingWeatherId(event.id);
    setWeatherErrors((current) => ({ ...current, [event.id]: "" }));
    setNotice("");

    try {
      const weather = await fetchWeatherForEvent(event, venue);
      updateEvent({
        ...event,
        weather,
        updatedAt: new Date().toISOString(),
      });
      refreshEvents();
      setNotice(`Weather saved for ${event.title}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch weather.";
      setWeatherErrors((current) => ({ ...current, [event.id]: message }));
      setNotice(message);
    } finally {
      setFetchingWeatherId(null);
    }
  };

  const handleLoadSampleData = () => {
    const sampleEvents = createSampleEvents(venues);
    saveEvents(sampleEvents);
    setEvents(sortByDateDesc(sampleEvents));
    setFilters(defaultFilters);
    setNotice("Sample data loaded.");
  };

  const handleViewVenueMap = (venueId: string) => {
    setSelectedVenueId(venueId);
    setActiveView("venues");
    setNotice("");
  };

  const handleDeleteTicketApplication = (id: string) => {
    const application = ticketApplications.find((item) => item.id === id);
    const confirmed = window.confirm(`Delete "${application?.eventTitle ?? "this ticket application"}"?`);

    if (!confirmed) {
      return;
    }

    deleteTicketApplication(id);
    refreshTicketApplications();
    setNotice("Ticket application deleted.");
  };

  const handleCreateEventFromApplication = (application: TicketApplication) => {
    if (application.linkedEventId) {
      setNotice("Event record already created.");
      return;
    }

    const venue = application.venueId ? getVenueById(application.venueId) : undefined;

    if (!venue || !application.eventDate) {
      setNotice("Select a venue and event date before creating an event record.");
      return;
    }

    const now = new Date().toISOString();
    const record: EventRecord = {
      id: crypto.randomUUID(),
      title: application.eventTitle,
      artist: application.artist,
      date: application.eventDate,
      startTime: "",
      venueId: venue.id,
      venueName: venue.name,
      city: venue.city,
      country: venue.country,
      ticketType: application.ticketType ?? "",
      seat: {
        gate: "",
        level: "",
        block: "",
        row: "",
        number: "",
      },
      notes: `Created from ticket application.${application.memo ? ` ${application.memo}` : ""}`,
      createdAt: now,
      updatedAt: now,
    };

    addEvent(record);
    updateTicketApplication({
      ...application,
      linkedEventId: record.id,
      updatedAt: now,
    });
    refreshEvents();
    refreshTicketApplications();
    setNotice("Event record created from ticket application.");
  };

  return (
    <div className="app-shell" data-theme={theme}>
      <Header
        activeView={activeView}
        theme={theme}
        totalEvents={events.length}
        onNavigate={handleNavigate}
        onThemeChange={handleThemeChange}
      />

      <main className="app-main">
        <section className="hero-panel">
          <div>
            <span className="eyebrow">Anime / idol / live concert archive</span>
            <h2>Keep every live memory as a ticket stub.</h2>
          </div>
          <p>
            Track venue, seat, ticket lotteries, notes, maps, and historical weather for every Japan live event.
          </p>
        </section>

        {notice ? <p className="notice" role="status">{notice}</p> : null}

        {activeView === "events" ? (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Saved records</span>
                <h2>Events</h2>
              </div>
            </div>
            <FilterBar
              artists={filterOptions.artists}
              filters={filters}
              venues={filterOptions.venues}
              years={filterOptions.years}
              onChange={setFilters}
              onClear={() => setFilters(defaultFilters)}
            />
            <EventList
              events={filteredEvents}
              fetchingWeatherId={fetchingWeatherId}
              isCompletelyEmpty={events.length === 0}
              weatherErrors={weatherErrors}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onFetchWeather={handleFetchWeather}
              onLoadSampleData={handleLoadSampleData}
              onViewVenueMap={handleViewVenueMap}
            />
          </>
        ) : null}

        {activeView === "timeline" ? <Timeline events={events} onEdit={handleEdit} /> : null}

        {activeView === "venues" ? (
          <VenuesPage events={events} selectedVenueId={selectedVenueId} onEdit={handleEdit} />
        ) : null}

        {activeView === "statistics" ? (
          <Statistics events={events} ticketApplications={ticketApplications} />
        ) : null}

        {activeView === "tickets" ? (
          <TicketManager
            applications={ticketApplications}
            editingApplication={editingApplication}
            venues={venues}
            onCancelEditing={() => setEditingApplication(null)}
            onCreateEventRecord={handleCreateEventFromApplication}
            onDelete={handleDeleteTicketApplication}
            onEdit={(application) => setEditingApplication(application)}
            onSave={handleSaveTicketApplication}
          />
        ) : null}

        {activeView === "add" ? (
          <EventForm
            editingEvent={editingEvent}
            venues={venues}
            onCancelEditing={() => {
              setEditingEvent(null);
              setActiveView("events");
            }}
            onSave={handleSaveEvent}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
