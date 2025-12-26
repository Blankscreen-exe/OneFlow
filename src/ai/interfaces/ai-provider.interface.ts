export interface IAiProvider {
  /**
   * Generate proposal content based on a prompt
   * @param prompt The prompt describing what proposal to generate
   * @returns Generated proposal content
   */
  generateProposal(prompt: string): Promise<string>;
}

