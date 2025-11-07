import { SystemPromptComponent } from "./interfaces";
import { liliPersona } from "../persona";

/**
 * System component that provides the assistant's persona.
 * This is a system-only component (no associated messages).
 * Contains the character definition and personality traits.
 */
export class PersonaComponent implements SystemPromptComponent {
  getLabel(): string {
    return "PERSONA";
  }

  getInstruction(): string {
    return liliPersona;
  }
}
