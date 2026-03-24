import { Timestamp } from "firebase/firestore";

export type Tag = "fix" | "hack" | "learn";

export interface Idea {
  id: string;
  title: string;
  description: string;
  tag: Tag;
  authorId: string;
  authorName: string;
  authorInitials: string;
  teamSize: number; // 0 = solo
  voteCount: number;
  commentCount: number;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  ideaId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  text: string;
  createdAt: Timestamp;
}

export interface TeamRequest {
  id: string;
  ideaId: string;
  ideaTitle: string;
  requesterId: string;
  requesterName: string;
  requesterInitials: string;
  authorId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
}

export interface TeamMember {
  ideaId: string;
  userId: string;
  userName: string;
  userInitials: string;
  joinedAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  initials: string;
  createdAt: Timestamp;
}
