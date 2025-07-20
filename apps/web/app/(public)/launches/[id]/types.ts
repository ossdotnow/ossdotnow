export interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  user: User;
}

export interface Launch {
  id: string;
  name: string;
  tagline: string;
  detailedDescription: string | null;
  description: string | null;
  logoUrl: string | null;
  gitRepoUrl: string;
  gitHost: 'github' | 'gitlab' | null;
  type: string | null;
  launchDate: Date;
  featured: boolean;
  owner: User;
  voteCount: number;
  commentCount: number;
  tags: string[];
  hasVoted: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  gitRepoUrl: string;
  gitHost: 'github' | 'gitlab' | null;
  ownerId: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isRepoPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}
