import { registerTemplate, TemplateRegistrationError } from '../registry';
import { minimalRuntimeTemplate } from './minimal';

export const runtimeTemplates = [minimalRuntimeTemplate];

for (const template of runtimeTemplates) {
  try {
    registerTemplate(template);
  } catch (error) {
    if (error instanceof TemplateRegistrationError) {
      // Allow re-importing the module in dev/hot environments without crashing.
      continue;
    }
    throw error;
  }
}
