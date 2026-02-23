import { Injectable, Logger } from '@nestjs/common';
import * as vm from 'vm';

@Injectable()
export class RegexService {
    private readonly logger = new Logger(RegexService.name);
    private readonly TIMEOUT_MS = 100; // 100ms timeout for regex execution

    /**
     * Safe regex execution using a VM sandbox to prevent catastrophic backtracking and DoS.
     */
    async replace(
        input: string,
        pattern: string,
        replacement: string,
        flags: string = 'g',
    ): Promise<string> {
        const sandbox = {
            input,
            pattern,
            replacement,
            flags,
            result: '',
            error: null,
        };

        const scriptCode = `
      try {
        const re = new RegExp(pattern, flags);
        result = input.replace(re, replacement);
      } catch (e) {
        error = e.message;
      }
    `;

        try {
            const script = new vm.Script(scriptCode);
            const context = vm.createContext(sandbox);

            script.runInContext(context, { timeout: this.TIMEOUT_MS });

            if (sandbox.error) {
                throw new Error(`Regex error: ${sandbox.error}`);
            }

            return sandbox.result;
        } catch (error: any) {
            if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
                this.logger.error(`Regex execution timed out: /${pattern}/${flags} on input of length ${input.length}`);
                throw new Error('Regex execution timed out (catastrophic backtracking suspected)');
            }
            this.logger.error(`Regex error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validates if a regex pattern and flags are safe and valid.
     */
    async validate(pattern: string, flags: string = 'g'): Promise<{ isValid: boolean; error?: string }> {
        try {
            new RegExp(pattern, flags);
            // Basic check for catastrophic backtracking patterns could be added here
            // For now, we rely on the execution timeout.
            return { isValid: true };
        } catch (error: any) {
            return { isValid: false, error: error.message };
        }
    }
}
