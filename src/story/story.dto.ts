export type StoryDto = {
  title: string;
  description: string;
  authorId: string;
  isprivate: boolean;
};

export type Chapter = {
  id: string;
  title: string;
  content: string;
  dateCreated: Date;
  storyId: string;
  order: number;
};

export type Story = {
  id: string;
  title: string;
  description: string | null;
  dateCreated: Date;
  authorId: string;
  isprivate: boolean;
  chapters: Chapter[];
};
