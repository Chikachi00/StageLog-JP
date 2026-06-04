import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventForm } from "./components/EventForm";
import { EventList } from "./components/EventList";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import type { AppView } from "./components/Header";
import { Statistics } from "./components/Statistics";
import { TicketManager } from "./components/TicketManager";
import { Timeline } from "./components/Timeline";
import { VenuesPage } from "./components/VenuesPage";
import { useAuth } from "./context/AuthContext";
import { useUserSettings } from "./context/UserSettingsContext";
import { createSampleEvents } from "./data/sampleEvents";
import { getVenueById, getVenueSearchText, venues } from "./data/venues";
import {
  addCloudEvent,
  deleteCloudEvent,
  getCloudEvents,
  updateCloudEvent,
} from "./services/cloudEventService";
import {
  addCloudTicketApplication,
  deleteCloudTicketApplication,
  getCloudTicketApplications,
  updateCloudTicketApplication,
} from "./services/cloudTicketService";
import {
  addEvent as addLocalEvent,
  deleteEvent as deleteLocalEvent,
  getEvents as getLocalEvents,
  saveEvents as saveLocalEvents,
  updateEvent as updateLocalEvent,
} from "./services/eventStorage";
import {
  addTicketApplication,
  deleteTicketApplication,
  getTicketApplications,
  updateTicketApplication,
} from "./services/ticketStorage";
import {
  deleteEventImage,
  getEventImageSignedUrl,
  uploadEventImage,
} from "./services/storageService";
import { fetchWeatherForEvent } from "./services/weatherService";
import type { EventFilters, EventFormValues, EventRecord } from "./types/event";
import type { AppTheme } from "./types/theme";
import type { TicketApplication, TicketApplicationFormValues } from "./types/ticket";
import { getEventYear, sortByDateDesc } from "./utils/dateUtils";

const defaultFilters: EventFilters = {
  year: "all",
  artist: "all",
  venue: "all",
  search: "",
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
    imageUrl: values.removeImage ? undefined : values.imageUrl || undefined,
    imagePath: values.removeImage ? undefined : values.imagePath ?? editingEvent?.imagePath,
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

const getEventImportKey = (event: EventRecord) =>
  [event.title, event.artist, event.date, event.venueId].join("::").toLocaleLowerCase();

const getTicketImportKey = (application: TicketApplication) =>
  [application.eventTitle, application.artist, application.eventDate ?? "", application.platform]
    .join("::")
    .toLocaleLowerCase();

function App() {
  const { t } = useTranslation();
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const { theme, updateThemeSetting } = useUserSettings();
  const isCloudMode = Boolean(user && isSupabaseConfigured);
  const [events, setEvents] = useState<EventRecord[]>(() => sortByDateDesc(getLocalEvents()));
  const [ticketApplications, setTicketApplications] = useState<TicketApplication[]>(() =>
    getTicketApplications(),
  );
  const [eventsLoading, setEventsLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [localEventCount, setLocalEventCount] = useState(() => getLocalEvents().length);
  const [localTicketCount, setLocalTicketCount] = useState(() => getTicketApplications().length);
  const [isImportingLocalEvents, setIsImportingLocalEvents] = useState(false);
  const [isImportingLocalTickets, setIsImportingLocalTickets] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("events");
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
      const venue = getVenueById(event.venueId);
      const matchesYear = filters.year === "all" || getEventYear(event.date) === filters.year;
      const matchesArtist = filters.artist === "all" || event.artist === filters.artist;
      const matchesVenue = filters.venue === "all" || event.venueName === filters.venue;
      const matchesSearch =
        !search ||
        [event.title, event.artist, event.venueName, event.city, event.country].some((value) =>
          value.toLowerCase().includes(search),
        ) ||
        (venue ? getVenueSearchText(venue).includes(search) : false);

      return matchesYear && matchesArtist && matchesVenue && matchesSearch;
    });
  }, [events, filters]);

  const refreshEvents = useCallback(async () => {
    setLocalEventCount(getLocalEvents().length);

    if (authLoading) {
      return;
    }

    if (!isCloudMode || !user) {
      setCloudError("");
      setEvents(sortByDateDesc(getLocalEvents()));
      return;
    }

    setEventsLoading(true);
    setCloudError("");

    try {
      const cloudEvents = await getCloudEvents(user.id);
      const eventsWithImages = await Promise.all(
        cloudEvents.map(async (event) => {
          if (!event.imagePath) {
            return event;
          }

          try {
            return { ...event, imageUrl: await getEventImageSignedUrl(event.imagePath) };
          } catch {
            return event;
          }
        }),
      );
      setEvents(sortByDateDesc(eventsWithImages));
    } catch {
      setCloudError(t("auth.failedLoadCloudEvents"));
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [authLoading, isCloudMode, t, user]);

  useEffect(() => {
    void refreshEvents();
    setEditingEvent(null);
    setFilters(defaultFilters);
  }, [refreshEvents]);

  const refreshTicketApplications = useCallback(async () => {
    setLocalTicketCount(getTicketApplications().length);

    if (authLoading) {
      return;
    }

    if (!isCloudMode || !user) {
      setTicketApplications(getTicketApplications());
      return;
    }

    setTicketsLoading(true);

    try {
      setTicketApplications(await getCloudTicketApplications(user.id));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("tickets.failedLoadCloudTickets"));
      setTicketApplications([]);
    } finally {
      setTicketsLoading(false);
    }
  }, [authLoading, isCloudMode, t, user]);

  useEffect(() => {
    void refreshTicketApplications();
    setEditingApplication(null);
  }, [refreshTicketApplications]);

  const handleThemeChange = (nextTheme: AppTheme) => {
    void updateThemeSetting(nextTheme);
  };

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    setNotice("");

    if (view === "add") {
      setEditingEvent(null);
    }
  };

  const handleSaveEvent = async (values: EventFormValues) => {
    setIsSavingEvent(true);

    try {
      const record = createRecord(values, editingEvent);

      if (isCloudMode && user) {
        let savedRecord = record;

        if (editingEvent) {
          savedRecord = await updateCloudEvent(record, user.id);
          setNotice(t("notice.eventUpdated"));
        } else {
          savedRecord = await addCloudEvent(record, user.id);
          setNotice(t("notice.eventSaved"));
        }

        if (values.removeImage && editingEvent?.imagePath) {
          try {
            await deleteEventImage(editingEvent.imagePath);
          } catch (error) {
            console.warn("Failed to delete event image", error);
          }
          savedRecord = await updateCloudEvent({ ...savedRecord, imagePath: undefined, imageUrl: undefined }, user.id);
        }

        if (values.imageFile) {
          try {
            const imagePath = await uploadEventImage(user.id, savedRecord.id, values.imageFile);

            if (editingEvent?.imagePath && editingEvent.imagePath !== imagePath) {
              try {
                await deleteEventImage(editingEvent.imagePath);
              } catch (error) {
                console.warn("Failed to delete replaced event image", error);
              }
            }

            const signedUrl = await getEventImageSignedUrl(imagePath);
            savedRecord = await updateCloudEvent(
              { ...savedRecord, imagePath, imageUrl: undefined, updatedAt: new Date().toISOString() },
              user.id,
            );
            savedRecord = { ...savedRecord, imageUrl: signedUrl };
            setNotice(t("storage.imageUploaded"));
          } catch (error) {
            setNotice(error instanceof Error ? error.message : t("storage.uploadFailed"));
          }
        }
      } else if (editingEvent) {
        updateLocalEvent(record);
        setNotice(t("notice.eventUpdated"));
      } else {
        addLocalEvent(record);
        setNotice(t("notice.eventSaved"));
      }

      setEditingEvent(null);
      await refreshEvents();
      setActiveView("events");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("auth.failedSaveEvent"));
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleSaveTicketApplication = async (
    values: TicketApplicationFormValues,
    currentEditingApplication?: TicketApplication | null,
  ) => {
    try {
      const application = createTicketApplication(values, currentEditingApplication);

      if (isCloudMode && user) {
        if (currentEditingApplication) {
          await updateCloudTicketApplication(application, user.id);
          setNotice(t("notice.ticketUpdated"));
        } else {
          await addCloudTicketApplication(application, user.id);
          setNotice(t("notice.ticketSaved"));
        }
      } else if (currentEditingApplication) {
        updateTicketApplication(application);
        setNotice(t("notice.ticketUpdated"));
      } else {
        addTicketApplication(application);
        setNotice(t("notice.ticketSaved"));
      }

      setEditingApplication(null);
      await refreshTicketApplications();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("notice.ticketSaveFailed"));
    }
  };

  const handleEdit = (event: EventRecord) => {
    setEditingEvent(event);
    setActiveView("add");
    setNotice("");
  };

  const handleDelete = async (id: string) => {
    const event = events.find((item) => item.id === id);
    const confirmed = window.confirm(
      t("notice.deleteEventConfirm", { title: event?.title ?? t("notice.thisEvent") }),
    );

    if (!confirmed) {
      return;
    }

    try {
      if (isCloudMode && user) {
        if (event?.imagePath) {
          try {
            await deleteEventImage(event.imagePath);
          } catch (error) {
            console.warn("Failed to delete event image", error);
          }
        }
        await deleteCloudEvent(id, user.id);
      } else {
        deleteLocalEvent(id);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("auth.failedSaveEvent"));
      return;
    }

    setWeatherErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    await refreshEvents();
    setNotice(t("notice.eventDeleted"));
  };

  const translateWeatherError = (message: string) => {
    if (message === "Weather data is only available after the event date.") {
      return t("weather.unavailableFuture");
    }

    if (message === "Venue is required to fetch weather.") {
      return t("weather.venueRequired");
    }

    if (message === "Venue coordinates are required to fetch weather.") {
      return t("weather.coordinatesRequired");
    }

    if (message === "Unable to fetch weather right now. Please check your network connection.") {
      return t("weather.networkError");
    }

    if (message === "Weather service returned an unreadable response.") {
      return t("weather.unreadable");
    }

    if (message === "No hourly weather data was returned for this event.") {
      return t("weather.noHourly");
    }

    if (message === "No temperature data was returned for the selected event time.") {
      return t("weather.noTemperature");
    }

    return message;
  };

  const handleFetchWeather = async (event: EventRecord) => {
    const venue = getVenueById(event.venueId);
    setFetchingWeatherId(event.id);
    setWeatherErrors((current) => ({ ...current, [event.id]: "" }));
    setNotice("");

    try {
      const weather = await fetchWeatherForEvent(event, venue);
      const updatedEvent = {
        ...event,
        weather,
        updatedAt: new Date().toISOString(),
      };

      if (isCloudMode && user) {
        await updateCloudEvent(updatedEvent, user.id);
      } else {
        updateLocalEvent(updatedEvent);
      }

      await refreshEvents();
      setNotice(t("notice.weatherSaved", { title: event.title }));
    } catch (error) {
      const message = translateWeatherError(
        error instanceof Error ? error.message : t("weather.networkError"),
      );
      setWeatherErrors((current) => ({ ...current, [event.id]: message }));
      setNotice(message);
    } finally {
      setFetchingWeatherId(null);
    }
  };

  const handleLoadSampleData = async () => {
    const sampleEvents = createSampleEvents(venues);

    try {
      if (isCloudMode && user) {
        await Promise.all(sampleEvents.map((event) => addCloudEvent(event, user.id)));
        await refreshEvents();
      } else {
        saveLocalEvents(sampleEvents);
        setEvents(sortByDateDesc(sampleEvents));
        setLocalEventCount(sampleEvents.length);
      }

      setFilters(defaultFilters);
      setNotice(t("notice.sampleLoaded"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("auth.failedSaveEvent"));
    }
  };

  const handleViewVenueMap = (venueId: string) => {
    setSelectedVenueId(venueId);
    setActiveView("venues");
    setNotice("");
  };

  const handleImportLocalDataToCloud = async () => {
    if (!isCloudMode || !user) {
      return;
    }

    const localEvents = getLocalEvents();
    const seenKeys = new Set(events.map(getEventImportKey));
    const eventsToImport = localEvents.filter((event) => {
      const key = getEventImportKey(event);

      if (seenKeys.has(key)) {
        return false;
      }

      seenKeys.add(key);
      return true;
    });

    setIsImportingLocalEvents(true);
    setNotice("");

    try {
      for (const event of eventsToImport) {
        await addCloudEvent(event, user.id);
      }

      await refreshEvents();
      setLocalEventCount(getLocalEvents().length);
      setNotice(t("auth.importedEvents", { count: eventsToImport.length }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("auth.failedSaveEvent"));
    } finally {
      setIsImportingLocalEvents(false);
    }
  };

  const handleDeleteTicketApplication = async (id: string) => {
    const application = ticketApplications.find((item) => item.id === id);
    const confirmed = window.confirm(
      t("notice.deleteTicketConfirm", {
        title: application?.eventTitle ?? t("notice.thisTicket"),
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      if (isCloudMode && user) {
        await deleteCloudTicketApplication(id, user.id);
      } else {
        deleteTicketApplication(id);
      }

      await refreshTicketApplications();
      setNotice(t("notice.ticketDeleted"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("notice.ticketSaveFailed"));
    }
  };

  const handleCreateEventFromApplication = async (application: TicketApplication) => {
    if (application.linkedEventId) {
      setNotice(t("notice.alreadyCreated"));
      return;
    }

    const venue = application.venueId ? getVenueById(application.venueId) : undefined;

    if (!venue || !application.eventDate) {
      setNotice(t("notice.createEventMissing"));
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
      notes: `${t("notice.createdFromTicket")}${application.memo ? ` ${application.memo}` : ""}`,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (isCloudMode && user) {
        await addCloudEvent(record, user.id);
      } else {
        addLocalEvent(record);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("auth.failedSaveEvent"));
      return;
    }

    const linkedApplication = {
      ...application,
      linkedEventId: record.id,
      updatedAt: now,
    };

    try {
      if (isCloudMode && user) {
        await updateCloudTicketApplication(linkedApplication, user.id);
      } else {
        updateTicketApplication(linkedApplication);
      }
      await refreshEvents();
      await refreshTicketApplications();
      setNotice(t("notice.eventCreatedFromTicket"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("notice.ticketSaveFailed"));
    }
  };

  const handleImportLocalTicketsToCloud = async () => {
    if (!isCloudMode || !user) {
      return;
    }

    const localTickets = getTicketApplications();
    const seenKeys = new Set(ticketApplications.map(getTicketImportKey));
    const ticketsToImport = localTickets.filter((application) => {
      const key = getTicketImportKey(application);

      if (seenKeys.has(key)) {
        return false;
      }

      seenKeys.add(key);
      return true;
    });

    setIsImportingLocalTickets(true);
    setNotice("");

    try {
      for (const application of ticketsToImport) {
        await addCloudTicketApplication(application, user.id);
      }

      await refreshTicketApplications();
      setLocalTicketCount(getTicketApplications().length);
      setNotice(t("auth.importedTickets", { count: ticketsToImport.length }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("notice.ticketSaveFailed"));
    } finally {
      setIsImportingLocalTickets(false);
    }
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
            <span className="eyebrow">{t("app.heroEyebrow")}</span>
            <h2>{t("app.heroTitle")}</h2>
          </div>
          <p>{t("app.heroDescription")}</p>
        </section>

        <section className="sync-panel" aria-label={t("auth.cloudSync")}>
          <div>
            <span>{t("auth.cloudSync")}</span>
            <strong>{isCloudMode ? t("auth.cloudMode") : t("auth.localMode")}</strong>
          </div>
          <p>{isCloudMode ? t("auth.cloudModeDescription") : t("auth.localModeDescription")}</p>
          {!isSupabaseConfigured ? <p>{t("auth.notConfigured")}</p> : null}
          {eventsLoading ? <p>{t("auth.loadingCloudEvents")}</p> : null}
          {ticketsLoading ? <p>{t("tickets.loadingCloudTickets")}</p> : null}
          {cloudError ? <p className="sync-panel__error">{cloudError}</p> : null}
          {isCloudMode && localEventCount > 0 ? (
            <button
              className="ghost-button"
              type="button"
              disabled={isImportingLocalEvents}
              onClick={handleImportLocalDataToCloud}
            >
              {isImportingLocalEvents ? t("auth.importing") : t("auth.importLocalData")}
            </button>
          ) : null}
          {isCloudMode && localTicketCount > 0 ? (
            <button
              className="ghost-button"
              type="button"
              disabled={isImportingLocalTickets}
              onClick={handleImportLocalTicketsToCloud}
            >
              {isImportingLocalTickets ? t("auth.importing") : t("auth.importLocalTickets")}
            </button>
          ) : null}
        </section>

        {notice ? <p className="notice" role="status">{notice}</p> : null}

        {activeView === "events" ? (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">{t("events.savedRecords")}</span>
                <h2>{t("events.title")}</h2>
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
            isSaving={isSavingEvent}
            useCloudImages={isCloudMode}
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
