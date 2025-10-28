export type PreviewIssueSeverity = 'info' | 'warning' | 'error';

export type PreviewIssue = {
  severity: PreviewIssueSeverity;
  message: string;
};

export type OfferPreviewTab = 'document' | 'summary' | 'issues';
