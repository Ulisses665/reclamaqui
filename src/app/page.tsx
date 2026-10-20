"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ReportStatus = "Em análise" | "Em andamento" | "Resolvida";
type Profile = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  classGroup: string;
  role: "student" | "admin";
  verified: boolean;
};
type Report = {
  id: string;
  ownerId?: string;
  title: string;
  description: string;
  category: string;
  place: string;
  author: string;
  createdAt: string;
  status: ReportStatus;
};
type Notification = {
  id: string;
  targetId: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const REPORTS_KEY = "reclamaqui:reports";
const PROFILES_KEY = "reclamaqui:profiles";
const NOTIFICATIONS_KEY = "reclamaqui:notifications";
const ACTIVE_PROFILE_KEY = "reclamaqui:active-profile";
const ADMIN_SETUP_CODE = process.env.NEXT_PUBLIC_DEMO_ADMIN_CODE;
const categories = ["Estrutura", "Convivência", "Ensino", "Alimentação", "Acessibilidade", "Outro"];
const statuses: ReportStatus[] = ["Em análise", "Em andamento", "Resolvida"];
const emptyRegistration = { name: "", email: "", password: "", classGroup: "", role: "student", adminCode: "" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Profile;
  return typeof profile.id === "string"
    && typeof profile.name === "string"
    && typeof profile.email === "string"
    && typeof profile.passwordHash === "string"
    && typeof profile.classGroup === "string"
    && (profile.role === "student" || profile.role === "admin")
    && typeof profile.verified === "boolean";
}

function isReport(value: unknown): value is Report {
  if (!value || typeof value !== "object") return false;
  const report = value as Report;
  return typeof report.id === "string"
    && typeof report.title === "string"
    && typeof report.description === "string"
    && typeof report.category === "string"
    && typeof report.place === "string"
    && typeof report.author === "string"
    && typeof report.createdAt === "string"
    && statuses.includes(report.status);
}

function isNotification(value: unknown): value is Notification {
  if (!value || typeof value !== "object") return false;
  const notification = value as Notification;
  return typeof notification.id === "string"
    && typeof notification.targetId === "string"
    && typeof notification.message === "string"
    && typeof notification.createdAt === "string"
    && typeof notification.read === "boolean";
}

async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("Todas");
  const [query, setQuery] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [accountModal, setAccountModal] = useState<"login" | "register" | "profile" | "edit" | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: categories[0], place: "" });
  const [registration, setRegistration] = useState(emptyRegistration);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [profileForm, setProfileForm] = useState({ name: "", email: "", classGroup: "", password: "" });

  const profile = profiles.find((item) => item.id === activeProfileId) ?? null;
  const inbox = notifications.filter((item) => item.targetId === profile?.id);
  const unreadCount = inbox.filter((item) => !item.read).length;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedReports: unknown = JSON.parse(localStorage.getItem(REPORTS_KEY) ?? "[]");
        const storedProfiles: unknown = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? "[]");
        const storedNotifications: unknown = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) ?? "[]");
        setReports(Array.isArray(storedReports) ? storedReports.filter(isReport) : []);
        const loadedProfiles = Array.isArray(storedProfiles) ? storedProfiles.filter(isProfile) : [];
        setProfiles(loadedProfiles);
        setNotifications(Array.isArray(storedNotifications) ? storedNotifications.filter(isNotification) : []);
        const savedProfileId = sessionStorage.getItem(ACTIVE_PROFILE_KEY);
        setActiveProfileId(loadedProfiles.some((item) => item.id === savedProfileId) ? savedProfileId : null);
      } catch {
        setNotice("Não foi possível carregar os dados locais. Verifique o armazenamento do navegador.");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
      } catch {
        setNotice("Não foi possível salvar os dados neste navegador.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reports, profiles, notifications, hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleReports = useMemo(() => {
    if (!profile || (profile.role === "student" && !profile.verified)) return [];
    return reports.filter((report) => {
      const belongsToViewer = profile.role === "admin" || report.ownerId === profile.id;
      const matchesCategory = filter === "Todas" || report.category === filter;
      const haystack = `${report.title} ${report.description} ${report.place} ${report.category}`.toLocaleLowerCase("pt-BR");
      return belongsToViewer && matchesCategory && haystack.includes(query.toLocaleLowerCase("pt-BR"));
    });
  }, [reports, profile, filter, query]);

  function addNotification(targetId: string, message: string) {
    setNotifications((current) => [{
      id: crypto.randomUUID(),
      targetId,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    }, ...current]);
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = registration.email.trim().toLocaleLowerCase("pt-BR");
    if (profiles.some((item) => item.email.toLocaleLowerCase("pt-BR") === email)) {
      setNotice("Já existe um perfil com esse e-mail neste navegador.");
      return;
    }
    const isAdmin = registration.role === "admin";
    if (isAdmin && (!ADMIN_SETUP_CODE || registration.adminCode !== ADMIN_SETUP_CODE)) {
      setNotice(ADMIN_SETUP_CODE
        ? "O código de configuração ADMIN está incorreto."
        : "O código ADMIN de demonstração ainda não foi configurado.");
      return;
    }
    try {
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        name: registration.name.trim(),
        email,
        passwordHash: await hashPassword(registration.password),
        classGroup: registration.classGroup.trim(),
        role: isAdmin ? "admin" : "student",
        verified: isAdmin,
      };
      setProfiles((current) => [...current, newProfile]);
      sessionStorage.setItem(ACTIVE_PROFILE_KEY, newProfile.id);
      setActiveProfileId(newProfile.id);
      setAccountModal(null);
      setRegistration(emptyRegistration);
      setNotice(isAdmin
        ? "Perfil ADMIN de demonstração criado neste navegador."
        : "Perfil criado. Aguarde a verificação da escola antes de registrar reclamações.");
    } catch {
      setNotice("Não foi possível criar o perfil. Verifique se este navegador oferece suporte à criptografia.");
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const email = login.email.trim().toLocaleLowerCase("pt-BR");
      const passwordHash = await hashPassword(login.password);
      const found = profiles.find((item) => item.email.toLocaleLowerCase("pt-BR") === email && item.passwordHash === passwordHash);
      if (!found) {
        setNotice("E-mail ou senha incorretos.");
        return;
      }
      sessionStorage.setItem(ACTIVE_PROFILE_KEY, found.id);
      setActiveProfileId(found.id);
      setAccountModal(null);
      setLogin({ email: "", password: "" });
    } catch {
      setNotice("Não foi possível iniciar a sessão neste navegador.");
    }
  }

  function signOut() {
    sessionStorage.removeItem(ACTIVE_PROFILE_KEY);
    setActiveProfileId(null);
    setAccountModal(null);
    setShowNotifications(false);
  }

  function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || profile.role !== "student" || !profile.verified) {
      setNotice("Somente alunos com perfil verificado podem registrar reclamações.");
      return;
    }
    const item: Report = {
      ...form,
      id: crypto.randomUUID(),
      ownerId: profile.id,
      author: profile.name,
      createdAt: new Date().toISOString(),
      status: "Em análise",
    };
    setReports((current) => [item, ...current]);
    profiles.filter((itemProfile) => itemProfile.role === "admin").forEach((admin) => {
      addNotification(admin.id, `Nova reclamação de ${profile.name}: ${item.title}`);
    });
    setForm({ title: "", description: "", category: categories[0], place: "" });
    setShowReportForm(false);
    setNotice("Reclamação registrada neste navegador. Nenhuma notificação foi enviada para fora dele.");
  }

  function verifyProfile(student: Profile) {
    setProfiles((current) => current.map((item) => item.id === student.id ? { ...item, verified: true } : item));
    addNotification(student.id, "Seu perfil foi verificado pela escola. Você já pode registrar reclamações.");
    setNotice(`Perfil de ${student.name} marcado como verificado nesta demonstração.`);
  }

  function changeReportStatus(report: Report, status: ReportStatus) {
    if (profile?.role !== "admin") return;
    setReports((current) => current.map((item) => item.id === report.id ? { ...item, status } : item));
    if (report.ownerId) addNotification(report.ownerId, `O status da sua reclamação "${report.title}" mudou para ${status}.`);
  }

  function deleteReport(report: Report) {
    if (!profile || report.status !== "Resolvida" || (profile.role !== "admin" && report.ownerId !== profile.id)) return;
    if (!window.confirm("Excluir esta reclamação deste navegador?")) return;
    setReports((current) => current.filter((item) => item.id !== report.id));
    setNotice("Reclamação excluída deste navegador.");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const email = profileForm.email.trim().toLocaleLowerCase("pt-BR");
    if (profiles.some((item) => item.id !== profile.id && item.email.toLocaleLowerCase("pt-BR") === email)) {
      setNotice("Já existe outro perfil com esse e-mail.");
      return;
    }
    try {
      const passwordHash = profileForm.password ? await hashPassword(profileForm.password) : profile.passwordHash;
      setProfiles((current) => current.map((item) => item.id === profile.id
        ? { ...item, name: profileForm.name.trim(), email, classGroup: profileForm.classGroup.trim(), passwordHash }
        : item));
      setAccountModal("profile");
      setNotice("Perfil atualizado neste navegador.");
    } catch {
      setNotice("Não foi possível atualizar o perfil.");
    }
  }

  function openProfileEditor() {
    if (!profile) return;
    setProfileForm({ name: profile.name, email: profile.email, classGroup: profile.classGroup, password: "" });
    setAccountModal("edit");
  }

  function markInboxRead() {
    if (!profile) return;
    setNotifications((current) => current.map((item) => item.targetId === profile.id ? { ...item, read: true } : item));
  }

  const pendingProfiles = profiles.filter((item) => item.role === "student" && !item.verified);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Reclamaqui, início">
          <span className="brand-mark">r<span>.</span></span><span>reclamaqui</span>
        </a>
        <nav className="top-nav" aria-label="Navegação principal">
          <a className="nav-link active" href="#inicio">Mural</a>
          <a className="nav-link" href="#como-funciona">Como funciona</a>
        </nav>
        {profile ? (
          <div className="account-controls">
            <button className="icon-button" aria-label={`Notificações: ${unreadCount} não lidas`} onClick={() => { setShowNotifications(true); markInboxRead(); }}>
              ♧{unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <button className="profile-button" onClick={() => setAccountModal("profile")}>
              <span className="avatar">{profile.name[0]?.toUpperCase() || "☺"}</span>
              <span>{profile.name}</span><span className="chevron">⌄</span>
            </button>
          </div>
        ) : (
          <div className="account-controls">
            <button className="secondary-button header-action" onClick={() => setAccountModal("login")}>Entrar</button>
            <button className="primary-button header-action" onClick={() => setAccountModal("register")}>Criar perfil</button>
          </div>
        )}
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot" /> UM ESPAÇO DE ESCUTA</span>
          <h1>Uma escola melhor<br />começa com <em>uma conversa.</em></h1>
          <p>Compartilhe o que pode melhorar. Acompanhe cada situação com respeito, cuidado e transparência.</p>
          {profile?.role === "student" && profile.verified && (
            <button className="primary-button" onClick={() => setShowReportForm(true)}><span>＋</span> Fazer uma reclamação</button>
          )}
          {!profile && <p className="hero-note">Entre ou crie um perfil para acessar suas reclamações.</p>}
          {profile?.role === "student" && !profile.verified && <p className="hero-note">Seu perfil aguarda verificação da escola. Reclamações ficam indisponíveis até a aprovação.</p>}
          {profile?.role === "admin" && <p className="hero-note">Acesso ADMIN de demonstração: você pode verificar perfis e acompanhar todas as reclamações.</p>}
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" /><div className="art-blob" />
          <div className="art-card art-card-back"><div className="art-lines"><i /><i /><i /></div><span className="art-sticker">✦</span></div>
          <div className="art-card art-card-front"><span className="art-bubble">“</span><div className="art-lines"><i /><i /><i /><i /></div><span className="art-heart">♡</span></div>
          <div className="art-plant"><i /><i /><i /><b /></div>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✦</span><span className="art-sparkle sparkle-three">·</span>
        </div>
      </section>

      <section className="community-strip">
        <div className="community-icon">✳</div>
        <p><strong>{profile?.role === "admin" ? "Visão administrativa" : "Suas reclamações"}</strong><span>{profile?.role === "admin" ? " A equipe ADMIN pode acompanhar os relatos dos alunos." : " Seus relatos são exibidos apenas nesta sessão de aluno."}</span></p>
        <div className="community-count"><strong>{visibleReports.length.toString().padStart(2, "0")}</strong><span>{profile?.role === "admin" ? "reclamações visíveis" : "reclamações suas"}</span></div>
      </section>

      {profile?.role === "admin" && (
        <section className="admin-section" aria-labelledby="pending-title">
          <div className="section-heading">
            <div><span className="eyebrow section-eyebrow">VERIFICAÇÃO DE PERFIS</span><h2 id="pending-title">Alunos aguardando aprovação</h2></div>
            <span className="result-count">{pendingProfiles.length} pendente{pendingProfiles.length === 1 ? "" : "s"}</span>
          </div>
          {pendingProfiles.length ? (
            <div className="pending-list">
              {pendingProfiles.map((student) => (
                <article className="pending-card" key={student.id}>
                  <div><strong>{student.name}</strong><span>{student.email} · {student.classGroup || "Turma não informada"}</span></div>
                  <button className="secondary-button" onClick={() => verifyProfile(student)}>Verificar perfil</button>
                </article>
              ))}
            </div>
          ) : <p className="subtle-copy">Não há perfis aguardando verificação.</p>}
        </section>
      )}

      <section className="board-section" aria-labelledby="board-title">
        <div className="section-heading">
          <div><span className="eyebrow section-eyebrow">{profile?.role === "admin" ? "TODOS OS ALUNOS" : "ÁREA PRIVADA DO ALUNO"}</span><h2 id="board-title">{profile?.role === "admin" ? "Reclamações da comunidade" : "Suas reclamações"}</h2></div>
          <label className="search-box"><span>⌕</span><input aria-label="Buscar reclamações" placeholder="Buscar reclamações..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label>
        </div>
        <div className="board-toolbar">
          <div className="filters" aria-label="Filtrar por categoria">{["Todas", ...categories].map((category) => <button key={category} className={`filter-chip ${filter === category ? "selected" : ""}`} onClick={() => setFilter(category)}>{category}</button>)}</div>
          <span className="result-count">{visibleReports.length} {visibleReports.length === 1 ? "reclamação" : "reclamações"}</span>
        </div>
        {visibleReports.length ? (
          <div className="report-grid">
            {visibleReports.map((report) => (
              <article className="report-card" key={report.id}>
                <div className="card-topline">
                  <span className={`category-tag tag-${report.category.toLowerCase().replaceAll("ç", "c").replaceAll("ã", "a")}`}>{report.category}</span>
                  <button className="more-button" title={report.status === "Resolvida" ? "Excluir reclamação resolvida" : "A reclamação permanece até ser resolvida"} aria-label={`Excluir ${report.title}`} disabled={report.status !== "Resolvida"} onClick={() => deleteReport(report)}>•••</button>
                </div>
                <h3>{report.title}</h3><p className="report-description">{report.description}</p>
                <div className="report-place"><span>⌖</span>{report.place}</div>
                <div className="card-footer">
                  <div className="author"><span className="small-avatar">{report.author[0]?.toUpperCase()}</span><span>{report.author}{profile?.role === "admin" && report.ownerId ? ` · ${profiles.find((item) => item.id === report.ownerId)?.classGroup || "Aluno"}` : ""}</span></div>
                  <span className="report-date">{formatDate(report.createdAt)}</span>
                </div>
                <div className="status-row">
                  <span className={`status-dot status-${report.status === "Resolvida" ? "done" : report.status === "Em andamento" ? "progress" : "review"}`} />
                  {profile?.role === "admin" ? (
                    <label className="status-select-label">Status
                      <select aria-label={`Status de ${report.title}`} value={report.status} onChange={(event) => changeReportStatus(report, event.target.value as ReportStatus)}>
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                  ) : report.status}
                  <span className="status-lock">· acompanhamento da escola</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>✳</span>
            <h3>{!profile ? "Entre para acessar o mural" : profile.role === "student" && !profile.verified ? "Perfil em análise" : "Nenhuma reclamação por aqui"}</h3>
            <p>{!profile ? "As reclamações são privadas para alunos e exigem um perfil." : profile.role === "student" && !profile.verified ? "A escola precisa verificar seu perfil antes que você possa registrar uma reclamação." : profile.role === "admin" ? "Ainda não há reclamações registradas neste navegador." : "Quando você registrar uma reclamação, poderá acompanhá-la nesta área privada."}</p>
            {!profile && <button className="text-button" onClick={() => setAccountModal("login")}>Entrar <span>→</span></button>}
            {profile?.role === "student" && profile.verified && <button className="text-button" onClick={() => setShowReportForm(true)}>Fazer uma reclamação <span>→</span></button>}
          </div>
        )}
      </section>

      <section className="safety-banner" id="como-funciona">
        <div className="safety-icon">♡</div>
        <div><h3>Um espaço seguro começa com respeito.</h3><p>Evite expor nomes ou dados pessoais de outras pessoas. Este protótipo salva informações apenas neste navegador; não oferece verificação ou privacidade seguras e não envia notificações à escola.</p></div>
        <span className="demo-label">DEMONSTRAÇÃO LOCAL</span>
      </section>
      <footer className="footer"><a className="brand footer-brand" href="#inicio"><span className="brand-mark">r<span>.</span></span><span>reclamaqui</span></a><span>Feito para ouvir, cuidar e melhorar.</span><span>Um projeto da comunidade escolar&nbsp; ✳</span></footer>

      {notice && <div className="toast" role="status">✓&nbsp; {notice}</div>}

      {showReportForm && profile?.role === "student" && profile.verified && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowReportForm(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="report-form-title">
            <button className="modal-close" aria-label="Fechar" onClick={() => setShowReportForm(false)}>×</button>
            <span className="eyebrow section-eyebrow">RECLAMAÇÃO PRIVADA</span><h2 id="report-form-title">Conte o que aconteceu</h2>
            <p className="modal-intro">Apenas você e os perfis ADMIN deste navegador poderão ver este relato.</p>
            <form onSubmit={createReport} className="form-stack">
              <label>Título<input required maxLength={90} placeholder="Resuma a situação" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label>Descrição<textarea required minLength={10} maxLength={700} rows={4} placeholder="Conte os detalhes com respeito e sem expor dados pessoais." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <div className="form-row">
                <label>Categoria<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Local<input required maxLength={80} placeholder="Ex.: pátio, sala 4" value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} /></label>
              </div>
              <p className="privacy-note">Perfil verificado: {profile.name}. O registro fica neste navegador e não é enviado à escola.</p>
              <button className="primary-button submit-button" type="submit">Registrar reclamação <span>→</span></button>
            </form>
          </section>
        </div>
      )}

      {accountModal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAccountModal(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
            <button className="modal-close" aria-label="Fechar" onClick={() => setAccountModal(null)}>×</button>
            {accountModal === "login" && <>
              <span className="eyebrow section-eyebrow">ACESSO LOCAL</span><h2 id="account-title">Entrar no perfil</h2>
              <p className="modal-intro">Acesse o perfil salvo neste navegador.</p>
              <form className="form-stack" onSubmit={signIn}>
                <label>E-mail<input type="email" autoComplete="email" required value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label>
                <label>Senha<input type="password" autoComplete="current-password" required value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>
                <button className="primary-button submit-button" type="submit">Entrar <span>→</span></button>
              </form>
              <p className="modal-switch">Ainda não tem perfil? <button className="text-button" onClick={() => setAccountModal("register")}>Criar perfil</button></p>
            </>}

            {accountModal === "register" && <>
              <span className="eyebrow section-eyebrow">PERFIL ESCOLAR</span><h2 id="account-title">Criar perfil</h2>
              <p className="modal-intro">O perfil de aluno ficará pendente até ser verificado por um ADMIN.</p>
              <form className="form-stack" onSubmit={createAccount}>
                <label>Tipo de perfil<select value={registration.role} onChange={(event) => setRegistration({ ...registration, role: event.target.value })}><option value="student">Aluno</option><option value="admin">ADMIN da escola (demonstração)</option></select></label>
                {registration.role === "admin" && <label>Código ADMIN da demonstração<input required type="password" autoComplete="off" value={registration.adminCode} onChange={(event) => setRegistration({ ...registration, adminCode: event.target.value })} /><small className="field-note">Configurado por NEXT_PUBLIC_DEMO_ADMIN_CODE. Esse código fica visível no aplicativo e não protege o acesso de verdade.</small></label>}
                <label>Nome<input required maxLength={60} value={registration.name} onChange={(event) => setRegistration({ ...registration, name: event.target.value })} /></label>
                <label>E-mail<input type="email" autoComplete="email" required value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} /></label>
                <label>Turma<input required maxLength={40} value={registration.classGroup} onChange={(event) => setRegistration({ ...registration, classGroup: event.target.value })} placeholder="Ex.: 2º ano B" /></label>
                <label>Senha<input type="password" autoComplete="new-password" minLength={8} required value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} /></label>
                <p className="privacy-note">Somente um fluxo demonstrativo: perfis e senhas ficam neste navegador. A escola não recebe os dados.</p>
                <button className="primary-button submit-button" type="submit">Criar perfil <span>→</span></button>
              </form>
              <p className="modal-switch">Já tem perfil? <button className="text-button" onClick={() => setAccountModal("login")}>Entrar</button></p>
            </>}

            {accountModal === "profile" && profile && <>
              <span className="eyebrow section-eyebrow">SEU ESPAÇO</span><h2 id="account-title">Meu perfil</h2>
              <div className="profile-summary">
                <span className="profile-avatar-large">{profile.name[0]?.toUpperCase()}</span>
                <div><strong>{profile.name}</strong><span>{profile.email}</span><small>{profile.role === "admin" ? "ADMIN · demonstração" : profile.classGroup}</small></div>
              </div>
              <div className="profile-warning">{profile.role === "admin" || profile.verified ? "Perfil marcado como verificado nesta demonstração." : "Perfil pendente: a escola precisa verificá-lo antes de você registrar reclamações."} O acesso não é seguro e os dados ficam apenas neste navegador.</div>
              <div className="profile-actions"><button className="secondary-button" onClick={openProfileEditor}>Editar perfil</button><button className="text-button" onClick={signOut}>Sair</button></div>
            </>}

            {accountModal === "edit" && profile && <>
              <span className="eyebrow section-eyebrow">SEU ESPAÇO</span><h2 id="account-title">Editar perfil</h2>
              <form className="form-stack" onSubmit={saveProfile}>
                <label>Nome<input required maxLength={60} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></label>
                <label>E-mail<input type="email" required value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></label>
                <label>Turma<input maxLength={40} value={profileForm.classGroup} onChange={(event) => setProfileForm({ ...profileForm, classGroup: event.target.value })} /></label>
                <label>Nova senha (opcional)<input type="password" autoComplete="new-password" minLength={8} value={profileForm.password} onChange={(event) => setProfileForm({ ...profileForm, password: event.target.value })} /></label>
                <p className="privacy-note">A senha é resumida localmente, mas isso não substitui autenticação segura.</p>
                <button className="primary-button submit-button" type="submit">Salvar alterações <span>→</span></button>
              </form>
            </>}
          </section>
        </div>
      )}

      {showNotifications && profile && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNotifications(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="notifications-title">
            <button className="modal-close" aria-label="Fechar" onClick={() => setShowNotifications(false)}>×</button>
            <span className="eyebrow section-eyebrow">NESTE NAVEGADOR</span><h2 id="notifications-title">Notificações</h2>
            <p className="modal-intro">Avisos locais de demonstração. Eles não são enviados à escola ou a outros dispositivos.</p>
            {inbox.length ? <ul className="notification-list">{inbox.map((item) => <li key={item.id}><span>{item.message}</span><time>{formatDate(item.createdAt)}</time></li>)}</ul> : <p className="subtle-copy">Nenhuma notificação.</p>}
          </section>
        </div>
      )}
    </main>
  );
}
