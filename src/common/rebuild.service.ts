import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class RebuildService {
  private readonly logger = new Logger(RebuildService.name);

  trigger(): void {
    const scriptPath = path.join(
      process.env.HOME || '~',
      'rebuild-cafeteria.sh',
    );
    const child = spawn('bash', [scriptPath], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    this.logger.log(`Rebuild triggered: ${scriptPath}`);
  }
}
