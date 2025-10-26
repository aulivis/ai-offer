export type ConsentCategories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = {
  granted: ConsentCategories;
  timestamp: string;
  version: string;
};
