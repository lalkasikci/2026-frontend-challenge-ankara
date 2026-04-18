import React, { useEffect, useMemo, useState } from 'react';

const PERSON_CATALOG = {
  'selin kaya': { id: 'selin-kaya', name: 'Selin Kaya', role: 'Organizer' },
  'mert demir': { id: 'mert-demir', name: 'Mert Demir', role: 'Driver' },
  'ece yalin': { id: 'ece-yalin', name: 'Ece Yalın', role: 'Volunteer' },
  'ece yalın': { id: 'ece-yalin', name: 'Ece Yalın', role: 'Volunteer' },
  'kaan arslan': { id: 'kaan-arslan', name: 'Kaan Arslan', role: 'Photographer' },
  'derya akin': { id: 'derya-akin', name: 'Derya Akın', role: 'Vet student' },
  'derya akın': { id: 'derya-akin', name: 'Derya Akın', role: 'Vet student' },
  podo: { id: 'podo', name: 'Podo', role: 'Missing pet' },
};

const JOTFORM_PROXY_BASE = process.env.REACT_APP_JOTFORM_PROXY_BASE || '/api/jotform';

const FORM_IDS = {
  checkins: '261065067494966',
  messages: '261065765723966',
  sightings: '261065244786967',
  notes: '261065509008958',
  tips: '261065875889981',
};

const SOURCE_CONFIG = [
  {
    key: 'checkins',
    label: 'Checkins',
    type: 'checkin',
    endpoint: `${JOTFORM_PROXY_BASE}/form/${FORM_IDS.checkins}/submissions`,
    color: 'bg-sky-100 text-sky-700',
  },
  {
    key: 'messages',
    label: 'Messages',
    type: 'message',
    endpoint: `${JOTFORM_PROXY_BASE}/form/${FORM_IDS.messages}/submissions`,
    color: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'sightings',
    label: 'Sightings',
    type: 'sighting',
    endpoint: `${JOTFORM_PROXY_BASE}/form/${FORM_IDS.sightings}/submissions`,
    color: 'bg-rose-100 text-rose-700',
  },
  {
    key: 'notes',
    label: 'Personal Notes',
    type: 'note',
    endpoint: `${JOTFORM_PROXY_BASE}/form/${FORM_IDS.notes}/submissions`,
    color: 'bg-violet-100 text-violet-700',
  },
  {
    key: 'tips',
    label: 'Anonymous Tips',
    type: 'tip',
    endpoint: `${JOTFORM_PROXY_BASE}/form/${FORM_IDS.tips}/submissions`,
    color: 'bg-emerald-100 text-emerald-700',
  },
];


export default function MissingPodoInvestigationApp() {
  const [records, setRecords] = useState([]);
  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('podo');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    let ignore = false;

    async function loadAll() {
      setLoading(true);
      setError('');

      try {
        const results = await Promise.all(
          SOURCE_CONFIG.map(async (source) => {
            const response = await fetch(source.endpoint, {
              headers: {
                Accept: 'application/json',
              },
            });

            if (!response.ok) {
              throw new Error(`${source.label} request failed with ${response.status}`);
            }

            return response.json();
          })
        );

        if (ignore) return;

        const merged = results.flatMap((payload, index) => normalizeSourcePayload(payload, SOURCE_CONFIG[index]));
        const sorted = merged.sort((a, b) => new Date(a.time) - new Date(b.time));
        const discoveredPeople = buildPeople(sorted);

        setRecords(sorted);
        setPeople(discoveredPeople);
        setSelectedRecordId(sorted[sorted.length - 1]?.id || null);
              } catch (err) {
        console.error(err);

        if (ignore) return;        setRecords([]);
        setPeople([]);
        setSelectedRecordId(null);
        setError(err instanceof Error ? err.message : 'Jotform data could not be loaded.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      } 
    }

    loadAll();
    return () => {
      ignore = true;
    };

  }, []);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch = !term
        ? true
        : [record.summary, record.location, record.typeLabel, ...(record.peopleNames || [])]
            .join(' ')
            .toLowerCase()
            .includes(term);

      const matchesPerson = selectedPersonId
        ? record.people.includes(selectedPersonId) || selectedPersonId === 'all'
        : true;

      return matchesSearch && matchesPerson;
    });
  }, [records, search, selectedPersonId]);

  const selectedRecord =
    filteredRecords.find((record) => record.id === selectedRecordId) || filteredRecords[filteredRecords.length - 1] || null;

  const timeline = useMemo(
    () => records.filter((record) => record.people.includes('podo')),
    [records]
  );

  const lastSeen = timeline[timeline.length - 1] || null;

  const suspectRanking = useMemo(() => rankSuspicion(records), [records]);

  return (
    <div className="min-h-screen bg-[#eef2ff] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="overflow-hidden rounded-[28px] bg-gradient-to-r from-[#0b2460] to-[#1d4ed8] text-white shadow-xl">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Investigation dashboard</p>
              <h1 className="mt-3 text-4xl font-black leading-none tracking-tight sm:text-5xl">
                Missing Podo: The Ankara Case
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                Records from multiple Jotform sources are merged into a single investigation view to reconstruct Podo’s
                last known route and identify the most suspicious person.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Badge className="bg-yellow-400 text-slate-950">MULTI-SOURCE FETCH</Badge>
                <Badge className="bg-white/15 text-white">RECORD LINKING</Badge>
                <Badge className="bg-pink-500 text-white">SUSPICION SCORING</Badge>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <h2 className="text-lg font-bold">Case summary</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <StatCard label="Records loaded" value={String(records.length)} />
                <StatCard label="Linked people" value={String(people.length)} />
                <StatCard label="Last confirmed location" value={lastSeen?.location || 'Unknown'} />
                <StatCard label="Prime suspect" value={suspectRanking[0]?.name || 'Unknown'} />
              </div>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="space-y-5">
            <Panel title="People">
              <button
                onClick={() => setSelectedPersonId('all')}
                className={`mb-2 w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  selectedPersonId === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                All people
              </button>

              <div className="space-y-2">
                {people.map((person) => {
                  const active = selectedPersonId === person.id;
                  return (
                    <button
                      key={person.id}
                      onClick={() => setSelectedPersonId(person.id)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                        active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{person.name}</div>
                          <div className="mt-1 text-sm text-slate-600">{person.role}</div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                          {person.recordCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Investigation hints">
              <div className="space-y-3 text-sm leading-6 text-slate-700">
                <p>
                  <span className="font-bold">Last solid sighting:</span> {lastSeen ? `${lastSeen.location} at ${formatTime(lastSeen.time)}` : 'Unknown'}
                </p>
                <p>
                  <span className="font-bold">Last seen with:</span> {lastSeen?.peopleNames.filter((name) => name !== 'Podo').join(', ') || 'Unknown'}
                </p>
                <p>
                  <span className="font-bold">Source mode:</span> Live Jotform API
                </p>
              </div>
            </Panel>
          </aside>

          <main className="space-y-5">
            <Panel title="Investigation feed">
              <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by person, location, source, or text"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-blue-500"
                />
                <button
                  onClick={() => setSearch('')}
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>

              {loading ? <EmptyState text="Loading records from Jotform endpoints..." /> : null}

              {!loading && filteredRecords.length === 0 ? <EmptyState text="No records match this filter." /> : null}

              {!loading && filteredRecords.length > 0 ? (
                <div className="space-y-3">
                  {filteredRecords.map((record) => {
                    const active = selectedRecord?.id === record.id;
                    return (
                      <button
                        key={record.id}
                        onClick={() => setSelectedRecordId(record.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${record.badgeColor}`}>
                              {record.typeLabel}
                            </span>
                            <span className="text-sm font-semibold text-slate-500">{formatTime(record.time)}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-500">{record.location}</span>
                        </div>

                        <div className="mt-3 text-base font-bold text-slate-900">{record.summary}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-600">{record.peopleNames.join(' · ')}</div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Panel>

            <Panel title="Podo timeline">
              {timeline.length === 0 ? (
                <EmptyState text="No direct Podo records available." />
              ) : (
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-blue-600" />
                        {index !== timeline.length - 1 ? <div className="mt-1 h-full w-px bg-slate-200" /> : null}
                      </div>
                      <div className="pb-4">
                        <div className="text-sm font-semibold text-slate-500">{formatTime(item.time)}</div>
                        <div className="mt-1 font-bold">{item.location}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </main>

          <aside className="space-y-5">
            <Panel title="Record detail">
              {selectedRecord ? (
                <div className="space-y-4">
                  <div>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${selectedRecord.badgeColor}`}>
                      {selectedRecord.typeLabel}
                    </div>
                    <h3 className="mt-3 text-xl font-black">{selectedRecord.summary}</h3>
                  </div>

                  <DetailRow label="Time" value={formatTime(selectedRecord.time)} />
                  <DetailRow label="Location" value={selectedRecord.location} />
                  <DetailRow label="People" value={selectedRecord.peopleNames.join(', ')} />
                  <DetailRow label="Confidence" value={`${Math.round(selectedRecord.confidence * 100)}%`} />
                  <DetailRow label="Source" value={selectedRecord.sourceLabel} />

                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Full text</div>
                    <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {selectedRecord.rawText}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState text="Select a record to inspect its details." />
              )}
            </Panel>

            <Panel title="Most suspicious">
              <div className="space-y-3">
                {suspectRanking.map((person, index) => (
                  <div key={person.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-500">#{index + 1}</div>
                        <div className="text-lg font-black">{person.name}</div>
                        <div className="text-sm text-slate-600">{person.reason}</div>
                      </div>
                      <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-black text-white">
                        {person.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </div>
  );
}

function normalizeSourcePayload(payload, source) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.response)
          ? payload.response
          : [];

  return items.map((item, index) => normalizeRecord(flattenSubmission(item), source, index));
}

function flattenSubmission(item) {
  if (!item || typeof item !== 'object') return {};

  const answers = item.answers && typeof item.answers === 'object' ? item.answers : {};
  const flat = { ...item };

  Object.values(answers).forEach((answer) => {
    if (!answer || typeof answer !== 'object') return;

    const keyBase = String(answer.name || answer.text || answer.type || '').trim();
    const key = keyBase
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');

    const value = answer.answer;
    const normalizedValue = Array.isArray(value) ? value.join(', ') : value;

    if (key && normalizedValue != null && flat[key] == null) {
      flat[key] = normalizedValue;
    }
  });

  const aliasMap = {
    personname: 'person',
    subjectname: 'subject',
    sendername: 'sender',
    receivername: 'receiver',
    suspectname: 'suspect',
    seenwith: 'seenWith',
    withperson: 'with_person',
    with_person: 'with_person',
    locationname: 'location',
    timestamp: 'timestamp',
    createdat: 'created_at',
  };

  Object.entries(aliasMap).forEach(([alias, canonical]) => {
    if (flat[alias] != null && flat[canonical] == null) {
      flat[canonical] = flat[alias];
    }
  });

  return flat;
}

function normalizeRecord(item, source, index) {
  const time =
    item.timestamp ||
    item.created_at ||
    item.createdAt ||
    item.created_at_iso ||
    item.submissiondate ||
    item.createdat ||
    item.date ||
    item.datetime ||
    item.submissionDate ||
    new Date().toISOString();

  const peopleNames = extractPeople(item);
  const people = peopleNames.map(toPersonId);
  const location =
    item.location ||
    item.place ||
    item.address ||
    item.venue ||
    item.spot ||
    item.last_seen_location ||
    'Unknown location';
  const rawText =
    item.details ||
    item.content ||
    item.note ||
    item.notes ||
    item.text ||
    item.message ||
    item.tip ||
    item.description ||
    JSON.stringify(item, null, 2);

  return {
    id: item.id || `${source.type}-${index}`,
    type: source.type,
    typeLabel: source.label,
    badgeColor: source.color,
    time,
    location,
    people,
    peopleNames,
    confidence: deriveConfidence(item, source.type),
    summary: buildSummary(item, source.type, location),
    rawText,
    sourceLabel: source.label,
    sourceKey: source.key,
  };
}

function extractPeople(item) {
  const candidates = [
    item.person,
    item.person_name,
    item.owner,
    item.sender,
    item.receiver,
    item.seenWith,
    item.seenwith,
    item.subject,
    item.subject_name,
    item.suspect,
    item.name,
    item.full_name,
    item.with_person,
    item.withperson,
    ...(Array.isArray(item.people) ? item.people : []),
  ].filter(Boolean);

  const unique = [];

  candidates.forEach((value) => {
    if (!value) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    if (!unique.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) {
      unique.push(normalized);
    }
  });

  return unique.length ? unique : ['Unknown'];
}

function buildSummary(item, type, location) {
  if (type === 'sighting') {
    return `${item.subject || 'Subject'} seen with ${item.seenWith || 'unknown person'} at ${location}`;
  }

  if (type === 'message') {
    return `${item.sender || 'Unknown'} messaged ${item.receiver || 'unknown recipient'}`;
  }

  if (type === 'checkin') {
    return `${item.person || 'Unknown person'} checked in at ${location}`;
  }

  if (type === 'note') {
    return `${item.owner || 'Unknown'} left a personal note`;
  }

  if (type === 'tip') {
    return `Anonymous tip points to ${item.suspect || 'an unknown person'}`;
  }

  return `Record at ${location}`;
}

function deriveConfidence(item, type) {
  if (typeof item.confidence === 'number') return item.confidence;
  if (item.reliability === 'high') return 0.9;
  if (item.reliability === 'medium') return 0.72;
  if (item.reliability === 'low') return 0.45;
  if (type === 'tip') return 0.65;
  if (type === 'note') return 0.6;
  return 0.85;
}

function buildPeople(records) {
  const map = new Map();

  records.forEach((record) => {
    record.peopleNames.forEach((name) => {
      const id = toPersonId(name);
      const catalog = PERSON_CATALOG[name.toLowerCase()] || { id, name, role: 'Related person' };
      const current = map.get(id) || { ...catalog, recordCount: 0 };
      current.recordCount += 1;
      map.set(id, current);
    });
  });

  return Array.from(map.values()).sort((a, b) => b.recordCount - a.recordCount);
}

function rankSuspicion(records) {
  const scoreMap = new Map();

  records.forEach((record) => {
    const includesPodo = record.people.includes('podo');
    const nearEnd = new Date(record.time).getTime();

    record.people.forEach((personId) => {
      if (personId === 'podo' || personId === 'unknown') return;

      const current = scoreMap.get(personId) || {
        id: personId,
        name: getPersonName(personId),
        score: 0,
        reasons: [],
      };

      if (includesPodo) {
        current.score += 30;
        current.reasons.push('Seen directly with Podo');
      }

      if (record.type === 'message' && record.rawText.toLowerCase().includes('podo')) {
        current.score += 20;
        current.reasons.push('Mentioned Podo in messages');
      }

      if (record.type === 'tip') {
        current.score += 25;
        current.reasons.push('Flagged by anonymous tip');
      }

      if (record.type === 'note') {
        current.score += 18;
        current.reasons.push('Personal note suggests movement');
      }

      current.score += Math.floor(record.confidence * 10);
      current.lastSeen = Math.max(current.lastSeen || 0, nearEnd);

      scoreMap.set(personId, current);
    });
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => (b.score === a.score ? (b.lastSeen || 0) - (a.lastSeen || 0) : b.score - a.score))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      reason: item.reasons[0] || 'Linked through multiple records',
    }));
}

function toPersonId(name) {
  const text = String(name || 'unknown').trim().toLowerCase();
  const catalog = PERSON_CATALOG[text];
  if (catalog) return catalog.id;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'unknown';
}

function getPersonName(personId) {
  const entry = Object.values(PERSON_CATALOG).find((person) => person.id === personId);
  return entry?.name || personId;
}

function formatTime(value) {
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Panel({ title, children }) {
  return (
    <section className="rounded-[24px] border border-[#d9e1f6] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Badge({ children, className = '' }) {
  return <span className={`rounded-full px-4 py-2 text-xs font-black tracking-wide ${className}`}>{children}</span>;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-blue-100">{label}</div>
      <div className="mt-2 text-lg font-black">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">{text}</div>;
}
