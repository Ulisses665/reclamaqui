"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useState } from "react";

type ResponsibleStudent = {
  name: string;
  photo?: string;
};

const initialStudents: ResponsibleStudent[] = [
  { name: "Bianca" },
  { name: "Jeniffer" },
  { name: "Marcos Ulisses" },
];

export default function ResponsaveisPage() {
  const [students, setStudents] = useState(initialStudents);

  function addPhoto(event: ChangeEvent<HTMLInputElement>, index: number) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setStudents((current) => current.map((student, studentIndex) =>
        studentIndex === index ? { ...student, photo: String(reader.result) } : student,
      ));
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="app-shell team-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Reclamaqui, início">
          <span className="brand-mark">r<span>.</span></span><span>reclamaqui</span>
        </Link>
        <nav className="top-nav" aria-label="Navegação principal">
          <Link className="nav-link" href="/">Mural</Link>
          <Link className="nav-link" href="/#como-funciona">Como funciona</Link>
          <Link className="nav-link active" href="/alunos">Responsáveis</Link>
        </nav>
      </header>

      <section className="team-section" aria-labelledby="team-title">
        <span className="eyebrow"><span className="live-dot" /> PROJETO ESCOLAR</span>
        <h1 id="team-title">Alunos responsáveis pelo projeto</h1>
        <p>Conheça os estudantes que desenvolveram e cuidam do Reclamaqui.</p>

        <div className="team-grid">
          {students.map((student, index) => (
            <article className="team-card" key={student.name}>
              <label className="team-photo" aria-label={`Adicionar foto de ${student.name}`}>
                {student.photo ? (
                  <Image src={student.photo} alt={`Foto de ${student.name}`} fill unoptimized />
                ) : (
                  <span className="team-photo-placeholder">
                    <strong>{student.name[0]}</strong>
                    <small>Adicionar foto</small>
                  </span>
                )}
                <input
                  className="team-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => addPhoto(event, index)}
                />
              </label>
              <div className="team-card-copy">
                <span>Responsável pelo projeto</span>
                <h2>{student.name}</h2>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <Link className="brand footer-brand" href="/"><span className="brand-mark">r<span>.</span></span><span>reclamaqui</span></Link>
        <span>Feito para ouvir, cuidar e melhorar.</span>
        <span>Um projeto da comunidade escolar&nbsp; ✳</span>
      </footer>
    </main>
  );
}
