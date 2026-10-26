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
const STUDENT_PHOTOS_KEY = "reclamaqui:student-photos";

export default function ResponsaveisPage() {
  const [students, setStudents] = useState<ResponsibleStudent[]>(() => {
    if (typeof window === "undefined") return initialStudents;
    try {
      const savedPhotos = JSON.parse(localStorage.getItem(STUDENT_PHOTOS_KEY) ?? "[]") as unknown;
      if (!Array.isArray(savedPhotos)) return initialStudents;
      return initialStudents.map((student, index) => ({
        ...student,
        photo: typeof savedPhotos[index] === "string" ? savedPhotos[index] : undefined,
      }));
    } catch {
      return initialStudents;
    }
  });

  function saveStudents(nextStudents: ResponsibleStudent[]) {
    try {
      localStorage.setItem(STUDENT_PHOTOS_KEY, JSON.stringify(nextStudents.map((student) => student.photo ?? null)));
      setStudents(nextStudents);
    } catch {
      window.alert("Não foi possível salvar a foto. Remova uma imagem existente ou escolha uma foto menor.");
    }
  }

  async function compressPhoto(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("image-too-large");
    }

    const bitmap = await createImageBitmap(file);
    const maxWidth = 800;
    const maxHeight = 800;
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas-unavailable");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("compression-failed")), "image/jpeg", 0.78);
    });

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function addPhoto(event: ChangeEvent<HTMLInputElement>, index: number) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const photo = await compressPhoto(file);
      const nextStudents = students.map((student, studentIndex) =>
        studentIndex === index ? { ...student, photo } : student,
      );
      saveStudents(nextStudents);
    } catch (error) {
      window.alert(error instanceof Error && error.message === "image-too-large"
        ? "Escolha uma imagem com até 10 MB."
        : "Não foi possível processar esta imagem. Tente outra foto.");
    }
  }

  function removePhoto(index: number) {
    const nextStudents = students.map((student, studentIndex) =>
      studentIndex === index ? { ...student, photo: undefined } : student,
    );
    saveStudents(nextStudents);
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
                <div>
                  <span>Responsável pelo projeto</span>
                  <h2>{student.name}</h2>
                </div>
                {student.photo && (
                  <button className="team-photo-remove" type="button" onClick={() => removePhoto(index)}>Remover foto</button>
                )}
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
