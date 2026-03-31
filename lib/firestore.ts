import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type TeamMember = {
  uid: string;
  name: string;
  role: "admin" | "member";
};

export type Team = {
  id: string;
  name: string;
  createdBy: string;
  createdAt?: unknown;
  members: TeamMember[];
  memberIds: string[];
  inviteCode?: string;
};

export type Task = {
  id: string;
  teamId: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  assignedTo?: string;
  createdBy: string;
  createdAt?: unknown;
};

// ─────────────────────────────────────────────
// Teams
// ─────────────────────────────────────────────

export async function createTeam(
  teamName: string,
  userId: string,
  userName: string
): Promise<string> {
  const cleanedTeamName = teamName.trim();
  if (!cleanedTeamName) throw new Error("El nombre del equipo es obligatorio.");
  if (!userId) throw new Error("Usuario inválido para crear equipo.");

  // Código de invitación de 6 caracteres
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const payload = {
    name: cleanedTeamName,
    createdBy: userId,
    createdAt: serverTimestamp(),
    inviteCode,
    members: [{ uid: userId, name: userName || "Usuario", role: "admin" as const }],
    memberIds: [userId],
  };

  const docRef = await addDoc(collection(db, "teams"), payload);
  return docRef.id;
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  if (!userId) return [];

  const q = query(
    collection(db, "teams"),
    where("memberIds", "array-contains", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "Equipo sin nombre",
      createdBy: data.createdBy ?? "",
      createdAt: data.createdAt,
      inviteCode: data.inviteCode ?? "",
      members: Array.isArray(data.members) ? (data.members as TeamMember[]) : [],
      memberIds: Array.isArray(data.memberIds) ? (data.memberIds as string[]) : [],
    };
  });
}

export async function joinTeamByCode(
  inviteCode: string,
  userId: string,
  userName: string
): Promise<string> {
  if (!inviteCode || !userId) throw new Error("Datos inválidos para unirse al equipo.");

  const q = query(
    collection(db, "teams"),
    where("inviteCode", "==", inviteCode.toUpperCase().trim())
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Código de invitación no encontrado.");

  const teamDoc = snapshot.docs[0];
  const data = teamDoc.data();

  if ((data.memberIds as string[]).includes(userId)) {
    throw new Error("Ya eres miembro de este equipo.");
  }

  await updateDoc(doc(db, "teams", teamDoc.id), {
    memberIds: arrayUnion(userId),
    members: arrayUnion({ uid: userId, name: userName || "Usuario", role: "member" }),
  });

  return teamDoc.id;
}

// ─────────────────────────────────────────────
// Tasks
// ─────────────────────────────────────────────

export async function getTeamTasks(teamId: string): Promise<Task[]> {
  if (!teamId) return [];

  const q = query(
    collection(db, "teams", teamId, "tasks"),
    orderBy("start", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      teamId,
      name: data.name ?? "Tarea sin nombre",
      start: (data.start as Timestamp).toDate(),
      end: (data.end as Timestamp).toDate(),
      progress: data.progress ?? 0,
      dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
      assignedTo: data.assignedTo ?? "",
      createdBy: data.createdBy ?? "",
      createdAt: data.createdAt,
    };
  });
}

export async function createTask(
  teamId: string,
  task: Omit<Task, "id" | "teamId" | "createdAt">,
  userId: string
): Promise<string> {
  if (!teamId || !userId) throw new Error("Datos inválidos para crear tarea.");

  const payload = {
    ...task,
    createdBy: userId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, "teams", teamId, "tasks"),
    payload
  );
  return docRef.id;
}

export async function updateTaskProgress(
  teamId: string,
  taskId: string,
  progress: number
): Promise<void> {
  await updateDoc(doc(db, "teams", teamId, "tasks", taskId), { progress });
}
