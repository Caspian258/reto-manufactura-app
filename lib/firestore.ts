import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
};

export async function createTeam(teamName: string, userId: string, userName: string) {
  const cleanedTeamName = teamName.trim();

  if (!cleanedTeamName) {
    throw new Error("El nombre del equipo es obligatorio.");
  }

  if (!userId) {
    throw new Error("Usuario invalido para crear equipo.");
  }

  const payload = {
    name: cleanedTeamName,
    createdBy: userId,
    createdAt: serverTimestamp(),
    members: [
      {
        uid: userId,
        name: userName || "Usuario",
        role: "admin" as const,
      },
    ],
    // Campo auxiliar para consultas eficientes por UID de miembro.
    memberIds: [userId],
  };

  const docRef = await addDoc(collection(db, "teams"), payload);
  return docRef.id;
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  if (!userId) {
    return [];
  }

  const teamsQuery = query(
    collection(db, "teams"),
    where("memberIds", "array-contains", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(teamsQuery);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      name: data.name ?? "Equipo sin nombre",
      createdBy: data.createdBy ?? "",
      createdAt: data.createdAt,
      members: Array.isArray(data.members) ? (data.members as TeamMember[]) : [],
      memberIds: Array.isArray(data.memberIds) ? (data.memberIds as string[]) : [],
    };
  });
}
