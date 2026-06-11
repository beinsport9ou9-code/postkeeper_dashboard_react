
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Search, LayoutDashboard, LibraryBig, Star, RefreshCw, HeartPulse, Sparkles,
  ChevronRight, ArrowUpRight, BookOpen, Image as ImageIcon, Video, Clock3,
  CircleAlert, ClipboardList, Eye, ExternalLink, Copy, X, Save, SlidersHorizontal,
  PlayCircle, WandSparkles, Shapes, Moon, Sun, UserRound, Download, PanelLeft,
  Hash, Settings, Grid2X2, List, Layers, Flame, Orbit, Zap, Bookmark
} from 'lucide-react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

const PRIORITIES = ['All', 'High', 'Medium', 'Low']
const MEDIA_FILTERS = ['All', 'With media', 'No media', 'Videos only', 'Images only']
const ARCHIVE_FILTERS = ['Active', 'Archived', 'All']
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority', label: 'Priority' },
  { value: 'topic', label: 'Topic' },
  { value: 'account', label: 'Account' }
]

function safe(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (Array.isArray(value)) return value.join(', ')
  return String(value).trim()
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch (_) {}
    return value.split(',').map(x => x.trim()).filter(Boolean)
  }
  return []
}

function getTopic(post) {
  return post?.main_topic || post?.topic || 'Uncategorized'
}

function getWorkspace(post) {
  return post?.workspace || 'Personal'
}

function getFolder(post) {
  return post?.folder || 'Dental'
}

function getPlatform(post) {
  return post?.source_platform || 'Instagram'
}

function getPriority(value) {
  const p = safe(value, 'Medium').toLowerCase()
  if (p.includes('high')) return 'High'
  if (p.includes('low')) return 'Low'
  return 'Medium'
}

function getMedia(post) {
  const urls = asArray(post?.media_urls)
  const types = asArray(post?.media_types)
  return {
    urls,
    types,
    coverUrl: post?.cover_media_url || urls[0] || '',
    coverType: post?.cover_media_type || types[0] || ''
  }
}

function isVideo(type, url = '') {
  const t = safe(type).toLowerCase()
  const u = safe(url).toLowerCase()
  return t.includes('video') || u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.webm')
}

function hasVideo(post) {
  const media = getMedia(post)
  return media.urls.some((url, i) => isVideo(media.types[i], url))
}

function hasImage(post) {
  const media = getMedia(post)
  return media.urls.some((url, i) => !isVideo(media.types[i], url))
}

function hasGenerated(post) {
  return Boolean(
    safe(post.generated_reel_script) ||
    safe(post.generated_patient_post) ||
    safe(post.reel_hook) ||
    safe(post.patient_script_idea)
  )
}

function formatDate(value) {
  try { return value ? new Date(value).toLocaleString() : '' }
  catch (_) { return safe(value) }
}

function searchBlob(post) {
  return [
    post.account, post.caption, post.topic, post.main_topic, post.subtopic, post.tags,
    post.content_type, post.clinical_use, post.priority, post.main_idea, post.key_points,
    post.suggested_use, post.reel_hook, post.patient_script_idea, post.generated_reel_script,
    post.generated_patient_post, post.personal_note, post.workspace, post.folder, post.source_platform, post.url
  ].map(x => safe(x).toLowerCase()).join(' ')
}

function copyText(value) {
  navigator.clipboard?.writeText(safe(value))
}

export default function App() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [topicFilter, setTopicFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [mediaFilter, setMediaFilter] = useState('All')
  const [workspaceFilter, setWorkspaceFilter] = useState('All')
  const [folderFilter, setFolderFilter] = useState('All')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [archiveFilter, setArchiveFilter] = useState('Active')
  const [accountFilter, setAccountFilter] = useState('All')
  const [tagFilter, setTagFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [selected, setSelected] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('pk-theme-v6') || 'light')
  const [viewMode, setViewMode] = useState('cards')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pk-theme-v6', theme)
  }, [theme])

  async function loadPosts() {
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      setError(error.message)
      setPosts([])
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadPosts() }, [])

  const topics = useMemo(() => {
    const map = {}
    posts.forEach(post => { map[getTopic(post)] = (map[getTopic(post)] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [posts])

  const accounts = useMemo(() => {
    const map = {}
    posts.forEach(post => {
      const account = safe(post.account, 'Unknown')
      map[account] = (map[account] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [posts])

  const tagEntries = useMemo(() => {
    const map = {}
    posts.forEach(post => {
      asArray(post.tags).forEach(tag => {
        if (tag) map[tag] = (map[tag] || 0) + 1
      })
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [posts])

  const workspaceEntries = useMemo(() => {
    const map = {}
    posts.forEach(post => { map[getWorkspace(post)] = (map[getWorkspace(post)] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [posts])

  const folderEntries = useMemo(() => {
    const map = {}
    posts.forEach(post => { map[getFolder(post)] = (map[getFolder(post)] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [posts])

  const platformEntries = useMemo(() => {
    const map = {}
    posts.forEach(post => { map[getPlatform(post)] = (map[getPlatform(post)] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [posts])

  const stats = useMemo(() => {
    let mediaFiles = 0
    let mediaPosts = 0
    let important = 0
    let videos = 0
    let generated = 0
    let archived = 0

    posts.forEach(post => {
      const mediaCount = Number(post.media_count || getMedia(post).urls.length || 0)
      mediaFiles += mediaCount
      if (mediaCount > 0) mediaPosts += 1
      if (post.is_important || getPriority(post.priority) === 'High') important += 1
      if (hasVideo(post)) videos += 1
      if (hasGenerated(post)) generated += 1
      if (post.is_archived) archived += 1
    })

    return { total: posts.length, mediaFiles, mediaPosts, important, videos, generated, archived, topics: topics.length, accounts: accounts.length, tags: tagEntries.length, folders: folderEntries.length, workspaces: workspaceEntries.length, platforms: platformEntries.length }
  }, [posts, topics, accounts, tagEntries, folderEntries, workspaceEntries, platformEntries])

  const availableTopics = useMemo(() => ['All', ...topics.map(([name]) => name)], [topics])
  const availableAccounts = useMemo(() => ['All', ...accounts.map(([name]) => name)], [accounts])
  const availableTags = useMemo(() => ['All', ...tagEntries.map(([name]) => name)], [tagEntries])
  const availableWorkspaces = useMemo(() => ['All', ...workspaceEntries.map(([name]) => name)], [workspaceEntries])
  const availableFolders = useMemo(() => ['All', ...folderEntries.map(([name]) => name)], [folderEntries])
  const availablePlatforms = useMemo(() => ['All', ...platformEntries.map(([name]) => name)], [platformEntries])

  const filtered = useMemo(() => {
    let rows = [...posts]

    if (tab === 'important') rows = rows.filter(post => post.is_important || getPriority(post.priority) === 'High')
    if (tab === 'studio') rows = rows.filter(hasGenerated)
    if (tab === 'media') rows = rows.filter(post => Number(post.media_count || 0) > 0 || getMedia(post).urls.length > 0)

    if (archiveFilter === 'Active') rows = rows.filter(post => !post.is_archived)
    if (archiveFilter === 'Archived') rows = rows.filter(post => post.is_archived)
    if (workspaceFilter !== 'All') rows = rows.filter(post => getWorkspace(post) === workspaceFilter)
    if (folderFilter !== 'All') rows = rows.filter(post => getFolder(post) === folderFilter)
    if (platformFilter !== 'All') rows = rows.filter(post => getPlatform(post) === platformFilter)

    if (topicFilter !== 'All') rows = rows.filter(post => getTopic(post) === topicFilter)
    if (priorityFilter !== 'All') rows = rows.filter(post => getPriority(post.priority) === priorityFilter)
    if (accountFilter !== 'All') rows = rows.filter(post => safe(post.account, 'Unknown') === accountFilter)
    if (tagFilter !== 'All') rows = rows.filter(post => asArray(post.tags).includes(tagFilter))

    if (mediaFilter === 'With media') rows = rows.filter(post => Number(post.media_count || 0) > 0 || getMedia(post).urls.length > 0)
    if (mediaFilter === 'No media') rows = rows.filter(post => Number(post.media_count || 0) === 0 && getMedia(post).urls.length === 0)
    if (mediaFilter === 'Videos only') rows = rows.filter(hasVideo)
    if (mediaFilter === 'Images only') rows = rows.filter(post => hasImage(post) && !hasVideo(post))

    const q = query.trim().toLowerCase()
    if (q) rows = rows.filter(post => searchBlob(post).includes(q))

    rows.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      if (sortBy === 'priority') {
        const score = post => getPriority(post.priority) === 'High' ? 3 : getPriority(post.priority) === 'Medium' ? 2 : 1
        return score(b) - score(a)
      }
      if (sortBy === 'topic') return getTopic(a).localeCompare(getTopic(b))
      if (sortBy === 'account') return safe(a.account).localeCompare(safe(b.account))
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })

    return rows
  }, [posts, tab, topicFilter, priorityFilter, mediaFilter, workspaceFilter, folderFilter, platformFilter, archiveFilter, accountFilter, tagFilter, query, sortBy])

  const recentPosts = useMemo(() => posts.filter(post => !post.is_archived).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8), [posts])
  const studioPosts = useMemo(() => posts.filter(post => !post.is_archived && hasGenerated(post)).slice(0, 5), [posts])

  async function updatePost(id, changes) {
    if (!supabase) return
    const { error } = await supabase.from('posts').update(changes).eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    setPosts(prev => prev.map(post => post.id === id ? { ...post, ...changes } : post))
    setSelected(prev => prev && prev.id === id ? { ...prev, ...changes } : prev)
  }

  function resetFilters() {
    setQuery('')
    setTopicFilter('All')
    setPriorityFilter('All')
    setMediaFilter('All')
    setWorkspaceFilter('All')
    setFolderFilter('All')
    setPlatformFilter('All')
    setArchiveFilter('Active')
    setAccountFilter('All')
    setTagFilter('All')
    setSortBy('newest')
  }

  function openTab(nextTab) {
    setTab(nextTab)
    setSidebarOpen(false)
  }

  const nav = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'posts', label: 'Library', icon: LibraryBig },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'studio', label: 'Studio', icon: WandSparkles },
    { id: 'important', label: 'Stars', icon: Star }
  ]

  return (
    <div className="appShell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brandWrap">
          <div className="brandMark"><Orbit size={23} /></div>
          <div>
            <h1>PostKeeper</h1>
            <p>Personal Library</p>
          </div>
        </div>

        <nav className="sidebarNav">
          {nav.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => openTab(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <button className="sidebarSettings" onClick={() => setSettingsOpen(true)}>
          <Settings size={17} />
          Advanced filters
        </button>

        <div className="sidebarGlowCard">
          <span>Library pulse</span>
          <strong>{stats.total}</strong>
          <p>{stats.mediaFiles} media files · {stats.important} starred</p>
        </div>
      </aside>

      <main className="mainArea">
        <header className="topbar">
          <div className="topbarLeft">
            <button className="iconBtn mobileOnly" onClick={() => setSidebarOpen(true)}><PanelLeft size={19} /></button>
            <div>
              <h2>{tabTitle(tab)}</h2>
              <p>{tabSubtitle(tab)}</p>
            </div>
          </div>

          <div className="topbarActions">
            <div className="topSearch">
              <Search size={17} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search posts, folders, recipes, travel..." />
            </div>
            <button className="iconBtn" title="Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="settingsBtn" onClick={() => setSettingsOpen(true)}><Settings size={17} /> Controls</button>
            <button className="refreshBtn" onClick={loadPosts}><RefreshCw size={16} /> Refresh</button>
          </div>
        </header>

        {!isConfigured && <Notice type="warning" title="Supabase not configured" text="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file." />}
        {error && <Notice type="error" title="Connection issue" text={error} />}

        {loading ? (
          <div className="loadingBlock">Opening your library...</div>
        ) : (
          <>
            {tab === 'dashboard' && (
              <DashboardView
                stats={stats}
                topics={topics}
                accounts={accounts}
                recentPosts={recentPosts}
                studioPosts={studioPosts}
                onTab={openTab}
                onTopic={name => { setTopicFilter(name); openTab('posts') }}
                onAccount={name => { setAccountFilter(name); openTab('posts') }}
                onPost={setSelected}
                setMediaFilter={setMediaFilter}
              />
            )}

            {['posts', 'media', 'important'].includes(tab) && (
              <LibraryView
                title={tabTitle(tab)}
                subtitle={tabSubtitle(tab)}
                posts={filtered}
                total={posts.length}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onPost={setSelected}
                resetFilters={resetFilters}
              />
            )}

            {tab === 'studio' && <StudioView posts={filtered} onPost={setSelected} />}
          </>
        )}
      </main>

      <nav className="bottomTabBar">
        {nav.map(item => {
          const Icon = item.icon
          return (
            <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => openTab(item.id)}>
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {settingsOpen && (
        <SettingsDrawer
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          viewMode={viewMode}
          setViewMode={setViewMode}
          topicFilter={topicFilter}
          setTopicFilter={setTopicFilter}
          availableTopics={availableTopics}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          mediaFilter={mediaFilter}
          setMediaFilter={setMediaFilter}
          workspaceFilter={workspaceFilter}
          setWorkspaceFilter={setWorkspaceFilter}
          availableWorkspaces={availableWorkspaces}
          folderFilter={folderFilter}
          setFolderFilter={setFolderFilter}
          availableFolders={availableFolders}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          availablePlatforms={availablePlatforms}
          archiveFilter={archiveFilter}
          setArchiveFilter={setArchiveFilter}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          availableAccounts={availableAccounts}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          availableTags={availableTags}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resetFilters={resetFilters}
          topics={topics}
          accounts={accounts}
          tagEntries={tagEntries}
          folderEntries={folderEntries}
          platformEntries={platformEntries}
          onTopic={name => { setTopicFilter(name); setSettingsOpen(false); openTab('posts') }}
          onAccount={name => { setAccountFilter(name); setSettingsOpen(false); openTab('posts') }}
          onTag={name => { setTagFilter(name); setSettingsOpen(false); openTab('posts') }}
        />
      )}

      {selected && <PostModal post={selected} onClose={() => setSelected(null)} onUpdate={updatePost} />}
    </div>
  )
}

function tabTitle(tab) {
  const map = { dashboard: 'Command Center', posts: 'Library', media: 'Media Vault', studio: 'Creative Studio', important: 'Starred Posts' }
  return map[tab] || 'Library'
}

function tabSubtitle(tab) {
  const map = {
    dashboard: 'Your visual board for saved links, ideas, media, and references',
    posts: 'All saved posts, organized and searchable',
    media: 'Images and videos saved from your sources',
    studio: 'Hooks, scripts, captions, and patient education ideas',
    important: 'Your highest-value references'
  }
  return map[tab] || ''
}

function Notice({ type, title, text }) {
  return <div className={`notice ${type}`}><CircleAlert size={18} /><div><strong>{title}</strong><p>{text}</p></div></div>
}

function DashboardView({ stats, topics, accounts, recentPosts, studioPosts, onTab, onTopic, onAccount, onPost }) {
  const cards = [
    { label: 'Saved ideas', value: stats.total, icon: BookOpen, onClick: () => onTab('posts'), tone: 'teal' },
    { label: 'Media vault', value: stats.mediaFiles, icon: ImageIcon, onClick: () => onTab('media'), tone: 'violet' },
    { label: 'Creative scripts', value: stats.generated, icon: WandSparkles, onClick: () => onTab('studio'), tone: 'coral' },
    { label: 'Starred', value: stats.important, icon: Star, onClick: () => onTab('important'), tone: 'gold' }
  ]

  return (
    <section className="pageWrap">
      <div className="heroBento">
        <div className="heroMain">
          <span className="kicker"><Sparkles size={14} /> PostKeeper Aurora</span>
          <h3>Turn saved links into a visual knowledge library.</h3>
          <p>Organize dental, travel, recipes, courses, ideas, and media in one clean workspace.</p>
          <div className="heroActions">
            <button onClick={() => onTab('posts')}>Explore Library <ArrowUpRight size={16} /></button>
            <button onClick={() => onTab('studio')}>Create Content <Zap size={16} /></button>
          </div>
        </div>

        <div className="heroSide">
          <div className="orbCard">
            <Flame size={22} />
            <strong>{stats.total}</strong>
            <span>saved ideas</span>
          </div>
          <div className="stackCards">
            <button onClick={() => onTab('media')}><Video size={17} /> {stats.videos} video posts</button>
            <button onClick={() => onTab('studio')}><Bookmark size={17} /> {stats.generated} reusable scripts</button>
            <button onClick={() => onTab('important')}><Star size={17} /> {stats.important} starred references</button>
          </div>
        </div>
      </div>

      <div className="metricGrid">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <button className={`metricCard ${card.tone}`} key={card.label} onClick={card.onClick}>
              <div><Icon size={22} /></div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </button>
          )
        })}
      </div>

      <div className="creativeSplit">
        <div className="glassPanel">
          <SectionHeader title="Topic Galaxy" actionLabel="Open all" onClick={() => onTab('posts')} />
          <div className="topicGalaxy">
            {topics.slice(0, 8).map(([name, count], i) => (
              <button key={name} className={`bubble b${i % 4}`} onClick={() => onTopic(name)}>
                <strong>{name}</strong>
                <span>{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glassPanel">
          <SectionHeader title="Source Flow" actionLabel="Accounts" />
          <div className="sourceFlow">
            {accounts.slice(0, 5).map(([name, count]) => (
              <button key={name} onClick={() => onAccount(name)}>
                <div><strong>{name}</strong><span>{count} posts</span></div>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <SectionHeader title="Freshly Saved" actionLabel="Open library" onClick={() => onTab('posts')} />
      <div className="postGrid">
        {recentPosts.map(post => <PostCard key={post.id} post={post} onOpen={() => onPost(post)} />)}
      </div>
    </section>
  )
}

function LibraryView({ title, subtitle, posts, total, viewMode, setViewMode, onPost, resetFilters }) {
  const INITIAL_VISIBLE = 18
  const STEP_VISIBLE = 18
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE)
  }, [posts, viewMode])

  const visiblePosts = posts.slice(0, visibleCount)
  const hasMore = visibleCount < posts.length

  return (
    <section className="pageWrap">
      <div className="libraryHeader">
        <div>
          <h3>{title}</h3>
          <p>{posts.length} result(s) from {total}. Showing {Math.min(visibleCount, posts.length)} first for faster mobile loading.</p>
        </div>
        <div>
          <button className="lightBtn" onClick={() => setViewMode(viewMode === 'cards' ? 'compact' : 'cards')}>
            {viewMode === 'cards' ? <List size={16} /> : <Grid2X2 size={16} />}
            {viewMode === 'cards' ? 'Compact' : 'Cards'}
          </button>
          <button className="lightBtn" onClick={resetFilters}>Reset</button>
        </div>
      </div>

      {posts.length === 0 ? <EmptyState title="No matching posts" text="Clear filters from Controls." /> : (
        <>
          {viewMode === 'compact'
            ? <div className="compactResults">{visiblePosts.map(post => <CompactRow key={post.id} post={post} onOpen={() => onPost(post)} />)}</div>
            : <div className="postGrid">{visiblePosts.map(post => <PostCard key={post.id} post={post} onOpen={() => onPost(post)} />)}</div>
          }
          {hasMore && <div className="loadMoreWrap"><button className="loadMoreBtn" onClick={() => setVisibleCount(count => count + STEP_VISIBLE)}>Load more posts</button></div>}
        </>
      )}
    </section>
  )
}

function StudioView({ posts, onPost }) {
  return (
    <section className="pageWrap">
      <div className="libraryHeader studioHeroMini">
        <div>
          <h3>Creative Studio</h3>
          <p>Hooks, scripts, captions, and patient education ideas.</p>
        </div>
      </div>

      {posts.length === 0 ? <EmptyState title="No studio content found" text="Generate scripts from Telegram buttons, then they will appear here." /> : (
        <div className="studioGrid">
          {posts.map(post => <StudioCard key={post.id} post={post} onOpen={() => onPost(post)} />)}
        </div>
      )}
    </section>
  )
}

function SettingsDrawer(props) {
  const {
    onClose, theme, setTheme, viewMode, setViewMode,
    topicFilter, setTopicFilter, availableTopics,
    priorityFilter, setPriorityFilter,
    mediaFilter, setMediaFilter,
    workspaceFilter, setWorkspaceFilter, availableWorkspaces,
    folderFilter, setFolderFilter, availableFolders,
    platformFilter, setPlatformFilter, availablePlatforms,
    archiveFilter, setArchiveFilter,
    accountFilter, setAccountFilter, availableAccounts,
    tagFilter, setTagFilter, availableTags,
    sortBy, setSortBy, resetFilters,
    topics, accounts, tagEntries, folderEntries, platformEntries, onTopic, onAccount, onTag
  } = props

  return (
    <div className="drawerBackdrop">
      <aside className="settingsDrawer">
        <div className="drawerHead">
          <div><h3>Controls</h3><p>Filters and layout stay here, not on the main page.</p></div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="drawerSection">
          <h4>Look</h4>
          <div className="segmented">
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={15} /> Light</button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={15} /> Dark</button>
          </div>
          <div className="segmented">
            <button className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}><Grid2X2 size={15} /> Cards</button>
            <button className={viewMode === 'compact' ? 'active' : ''} onClick={() => setViewMode('compact')}><List size={15} /> Compact</button>
          </div>
        </div>

        <div className="drawerSection">
          <h4>Filters</h4>
          <label><span>Topic</span><select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>{availableTopics.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Priority</span><select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>{PRIORITIES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Media</span><select value={mediaFilter} onChange={e => setMediaFilter(e.target.value)}>{MEDIA_FILTERS.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Archive</span><select value={archiveFilter} onChange={e => setArchiveFilter(e.target.value)}>{ARCHIVE_FILTERS.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Workspace</span><select value={workspaceFilter} onChange={e => setWorkspaceFilter(e.target.value)}>{availableWorkspaces.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Folder</span><select value={folderFilter} onChange={e => setFolderFilter(e.target.value)}>{availableFolders.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Platform</span><select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}>{availablePlatforms.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Account</span><select value={accountFilter} onChange={e => setAccountFilter(e.target.value)}>{availableAccounts.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Tag</span><select value={tagFilter} onChange={e => setTagFilter(e.target.value)}>{availableTags.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Sort</span><select value={sortBy} onChange={e => setSortBy(e.target.value)}>{SORTS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
          <button className="resetBtn" onClick={resetFilters}>Reset all filters</button>
        </div>

        <div className="drawerSection">
          <h4>Quick Jump</h4>
          <div className="chipCloud">
            {topics.slice(0, 12).map(([name, count]) => <button key={name} onClick={() => onTopic(name)}>{name} <b>{count}</b></button>)}
          </div>
        </div>

        <div className="drawerSection">
          <h4>Folders</h4>
          <div className="chipCloud">
            {folderEntries.slice(0, 16).map(([name, count]) => <button key={name} onClick={() => { setFolderFilter(name); onClose(); }}>{name} <b>{count}</b></button>)}
          </div>
        </div>

        <div className="drawerSection">
          <h4>Platforms</h4>
          <div className="chipCloud">
            {platformEntries.slice(0, 10).map(([name, count]) => <button key={name} onClick={() => { setPlatformFilter(name); onClose(); }}>{name} <b>{count}</b></button>)}
          </div>
        </div>

        <div className="drawerSection">
          <h4>Accounts</h4>
          <div className="chipCloud">
            {accounts.slice(0, 10).map(([name, count]) => <button key={name} onClick={() => onAccount(name)}>{name} <b>{count}</b></button>)}
          </div>
        </div>

        <div className="drawerSection">
          <h4>Tags</h4>
          <div className="chipCloud">
            {tagEntries.slice(0, 16).map(([name, count]) => <button key={name} onClick={() => onTag(name)}>#{name} <b>{count}</b></button>)}
          </div>
        </div>
      </aside>
    </div>
  )
}

function PostCard({ post, onOpen }) {
  const media = getMedia(post)
  const priority = getPriority(post.priority)
  const tags = asArray(post.tags)
  const mediaCount = Number(post.media_count || media.urls.length || 0)

  return (
    <article className="postCard clickableCard" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") onOpen() }}>
      <MediaPreview url={media.coverUrl} type={media.coverType} compact />
      <div className="postCardBody">
        <div className="badgeRow">
          <span className="badge folder">{getFolder(post)}</span>
          <span className="badge platform">{getPlatform(post)}</span>
          <span className="badge topic">{getTopic(post)}</span>
          <span className={`badge priority ${priority.toLowerCase()}`}>{priority}</span>
          {post.is_important && <span className="badge star">Starred</span>}
          {hasVideo(post) && <span className="badge video">Video</span>}
          {post.is_archived && <span className="badge archive">Archived</span>}
        </div>
        <h4>{post.subtopic || post.main_topic || 'Saved Post'}</h4>
        <p>{post.main_idea || post.caption || 'No summary available.'}</p>
        {tags.length > 0 && <div className="tagList">{tags.slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</div>}
        <div className="cardMeta"><span>{getWorkspace(post)} · {post.account || 'Unknown'}</span><span>{mediaCount ? `${mediaCount} media` : 'No media'}</span></div>
        <div className="cardActions">
          <button className="primarySmall" onClick={onOpen}><Eye size={15} /> View</button>
          {post.url && <a href={post.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><ExternalLink size={15} /> Link</a>}
        </div>
      </div>
    </article>
  )
}

function CompactRow({ post, onOpen }) {
  const media = getMedia(post)
  return (
    <article className="compactRow clickableCard" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") onOpen() }}>
      <div className="compactThumb">{media.coverUrl ? <MediaPreview url={media.coverUrl} type={media.coverType} compact /> : <ImageIcon size={20} />}</div>
      <div className="compactMain">
        <div className="badgeRow"><span className="badge folder">{getFolder(post)}</span><span className="badge topic">{getTopic(post)}</span><span className={`badge priority ${getPriority(post.priority).toLowerCase()}`}>{getPriority(post.priority)}</span></div>
        <strong>{post.subtopic || post.main_topic || 'Saved Post'}</strong>
        <p>{post.main_idea || post.caption || 'No summary available.'}</p>
      </div>
      <button className="primarySmall" onClick={onOpen}><Eye size={15} /> View</button>
    </article>
  )
}

function StudioCard({ post, onOpen }) {
  return (
    <article className="studioCard clickableCard" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") onOpen() }}>
      <div className="studioHead"><span className="badge topic">{getTopic(post)}</span><button onClick={e => { e.stopPropagation(); onOpen(); }}><Eye size={14} /> Open</button></div>
      <h4>{post.subtopic || post.main_topic || 'Saved Post'}</h4>
      <p>{post.main_idea || post.caption || 'No summary available.'}</p>
      <div className="studioBlocks">
        {post.reel_hook && <StudioSnippet label="Reel Hook" value={post.reel_hook} />}
        {post.generated_reel_script && <StudioSnippet label="Reel Script" value={post.generated_reel_script} />}
        {post.patient_script_idea && <StudioSnippet label="Patient Idea" value={post.patient_script_idea} />}
        {post.generated_patient_post && <StudioSnippet label="Patient Post" value={post.generated_patient_post} />}
      </div>
    </article>
  )
}

function StudioSnippet({ label, value }) {
  return (
    <div className="studioSnippet">
      <div><strong>{label}</strong><button onClick={e => { e.stopPropagation(); copyText(value); }}><Copy size={14} /> Copy</button></div>
      <p>{value}</p>
    </div>
  )
}

function MediaPreview({ url, type, compact = false }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(!compact)

  useEffect(() => {
    if (!compact || inView) return
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '360px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [compact, inView])

  if (!url) return <div ref={ref} className={`mediaPlaceholder ${compact ? 'compact' : ''}`}><ImageIcon size={28} /><span>No media</span></div>

  if (compact && !inView) {
    return <div ref={ref} className="mediaPlaceholder compact skeletonMedia"><ImageIcon size={24} /><span>Loading media</span></div>
  }

  if (isVideo(type, url)) {
    if (compact) {
      if (!inView) {
        return (
          <div ref={ref} className="mediaPlaceholder compact skeletonMedia">
            <Video size={24} />
            <span>Video</span>
          </div>
        )
      }

      return (
        <div ref={ref} className="mediaWrap compact realVideoCard">
          <video
            src={url}
            muted
            controls
            preload="metadata"
            playsInline
            webkit-playsinline="true"
          />
        </div>
      )
    }
    return <div ref={ref} className="mediaWrap"><video src={url} controls preload="metadata" playsInline webkit-playsinline="true" /></div>
  }

  return (
    <div ref={ref} className={`mediaWrap ${compact ? 'compact' : ''}`}>
      <img src={url} alt="Saved media" loading="lazy" decoding="async" fetchPriority="low" />
    </div>
  )
}

function PostModal({ post, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [priority, setPriority] = useState(getPriority(post.priority))
  const [mainTopic, setMainTopic] = useState(getTopic(post))
  const [subtopic, setSubtopic] = useState(post.subtopic || '')
  const [tags, setTags] = useState(safe(post.tags))
  const [personalNote, setPersonalNote] = useState(post.personal_note || '')
  const [workspace, setWorkspace] = useState(getWorkspace(post))
  const [folder, setFolder] = useState(getFolder(post))
  const [sourcePlatform, setSourcePlatform] = useState(getPlatform(post))
  const media = getMedia(post)

  function saveChanges() {
    onUpdate(post.id, { priority, main_topic: mainTopic, topic: mainTopic, subtopic, tags, personal_note: personalNote, workspace, folder, source_platform: sourcePlatform })
    setEditing(false)
  }

  return (
    <div className="modalBackdrop">
      <div className="modalCard">
        <button className="closeBtn" onClick={onClose}><X size={20} /></button>
        <div className="modalHeader">
          <div><span>Post Details</span><h3>{post.subtopic || getTopic(post)}</h3><p>{formatDate(post.created_at)}</p></div>
          <div>
            <button className={post.is_important ? 'markBtn active' : 'markBtn'} onClick={() => onUpdate(post.id, { is_important: !post.is_important, priority: !post.is_important ? 'High' : post.priority })}><Star size={16} /> {post.is_important ? 'Starred' : 'Star'}</button>
            <button className={post.is_archived ? 'markBtn active' : 'markBtn'} onClick={() => onUpdate(post.id, { is_archived: !post.is_archived })}>{post.is_archived ? 'Restore' : 'Archive'}</button>
            {post.url && <a className="ghostLink" href={post.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Original link</a>}
          </div>
        </div>

        <div className="modalGallery">
          {media.urls.length === 0 ? <MediaPreview /> : media.urls.map((url, i) => (
            <div key={`${url}-${i}`} className="mediaGalleryItem">
              <MediaPreview url={url} type={media.types[i]} />
              <a className="downloadBtn" href={url} target="_blank" rel="noreferrer" download><Download size={15} /> Open / Download</a>
            </div>
          ))}
        </div>

        <div className="modalGrid">
          <section className="modalPanel">
            <h4>Organize</h4>
            {editing ? (
              <div className="editGrid">
                <label><span>Workspace</span><input value={workspace} onChange={e => setWorkspace(e.target.value)} /></label>
                <label><span>Folder</span><input value={folder} onChange={e => setFolder(e.target.value)} /></label>
                <label><span>Platform</span><input value={sourcePlatform} onChange={e => setSourcePlatform(e.target.value)} /></label>
                <label><span>Main Topic</span><input value={mainTopic} onChange={e => setMainTopic(e.target.value)} /></label>
                <label><span>Subtopic</span><input value={subtopic} onChange={e => setSubtopic(e.target.value)} /></label>
                <label><span>Tags</span><input value={tags} onChange={e => setTags(e.target.value)} /></label>
                <label><span>Priority</span><select value={priority} onChange={e => setPriority(e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></label>
                <label><span>Personal Note</span><textarea rows={4} value={personalNote} onChange={e => setPersonalNote(e.target.value)} /></label>
                <button className="saveBtn" onClick={saveChanges}><Save size={15} /> Save changes</button>
              </div>
            ) : (
              <>
                <Info label="Workspace" value={getWorkspace(post)} />
                <Info label="Folder" value={getFolder(post)} />
                <Info label="Platform" value={getPlatform(post)} />
                <Info label="Status" value={post.is_archived ? 'Archived' : 'Active'} />
                <Info label="Main Topic" value={getTopic(post)} />
                <Info label="Subtopic" value={post.subtopic} />
                <Info label="Tags" value={post.tags} />
                <Info label="Priority" value={post.priority} />
                <Info label="Content Type" value={post.content_type} />
                <Info label="Clinical Use" value={post.clinical_use} />
                <Info label="Personal Note" value={post.personal_note} />
                <button className="editBtn" onClick={() => setEditing(true)}>Edit details</button>
              </>
            )}
          </section>

          <Panel title="Knowledge">
            <Info label="Main Idea" value={post.main_idea} large />
            <Info label="Key Points" value={post.key_points} large />
            <Info label="Suggested Use" value={post.suggested_use} large />
          </Panel>

          <Panel title="Caption">
            <p className="longText">{post.caption || 'No caption'}</p>
            <div className="actionButtons">
              <button onClick={() => copyText(post.caption)}><Copy size={15} /> Copy caption</button>
              {post.url && <a href={post.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open Original link</a>}
            </div>
          </Panel>

          <Panel title="Studio">
            <Info label="Reel Hook" value={post.reel_hook} large />
            <Info label="Patient Script Idea" value={post.patient_script_idea} large />
            <Info label="Generated Reel Script" value={post.generated_reel_script} large />
            <Info label="Generated Patient Post" value={post.generated_patient_post} large />
            <div className="actionButtons">
              <button onClick={() => copyText(post.reel_hook || post.generated_reel_script)}><Copy size={15} /> Copy reel</button>
              <button onClick={() => copyText(post.patient_script_idea || post.generated_patient_post)}><Copy size={15} /> Copy patient content</button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return <section className="modalPanel"><h4>{title}</h4>{children}</section>
}

function Info({ label, value, large = false }) {
  if (!value) return null
  return <div className={`infoBlock ${large ? 'large' : ''}`}><span>{label}</span><p>{safe(value)}</p></div>
}

function SectionHeader({ title, actionLabel, onClick }) {
  return <div className="sectionHeader"><h3>{title}</h3>{actionLabel && <button onClick={onClick}>{actionLabel}</button>}</div>
}

function EmptyState({ title, text }) {
  return <div className="emptyState"><ClipboardList size={42} /><h3>{title}</h3><p>{text}</p></div>
}
