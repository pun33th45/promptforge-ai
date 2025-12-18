
export enum PromptType {
  Chatbot = 'Chatbot',
  Image = 'Image Generation',
  Code = 'Code Generation',
  Writing = 'Writing',
  DataAnalysis = 'Data Analysis'
}

export enum Tone {
  Formal = 'Formal',
  Casual = 'Casual',
  Professional = 'Professional'
}

export enum SkillLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Expert = 'Expert'
}

export interface PromptRequest {
  idea: string;
  type: PromptType;
  tone: Tone;
  level: SkillLevel;
}

export interface HistoryItem {
  id: string;
  request: PromptRequest;
  result: string;
  timestamp: number;
}
