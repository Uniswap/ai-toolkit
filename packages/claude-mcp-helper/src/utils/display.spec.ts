import {
  colorize,
  displayServerList,
  displayDetailedStatus,
  displaySuccess,
  displayError,
  displayWarning,
  displayInfo,
} from './display';
import type { ServerStatus } from '../config/types';

describe('Display Utilities', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('colorize', () => {
    it('should wrap text with ANSI color codes', () => {
      const result = colorize('test', 'green');
      expect(result).toBe('\x1b[32mtest\x1b[0m');
    });

    it('should support red color', () => {
      const result = colorize('error', 'red');
      expect(result).toBe('\x1b[31merror\x1b[0m');
    });

    it('should support yellow color', () => {
      const result = colorize('warning', 'yellow');
      expect(result).toBe('\x1b[33mwarning\x1b[0m');
    });

    it('should support blue color', () => {
      const result = colorize('info', 'blue');
      expect(result).toBe('\x1b[34minfo\x1b[0m');
    });

    it('should support gray color', () => {
      const result = colorize('muted', 'gray');
      expect(result).toBe('\x1b[90mmuted\x1b[0m');
    });

    it('should support bold style', () => {
      const result = colorize('bold text', 'bold');
      expect(result).toBe('\x1b[1mbold text\x1b[0m');
    });

    it('should support reset', () => {
      const result = colorize('reset', 'reset');
      expect(result).toBe('\x1b[0mreset\x1b[0m');
    });
  });

  describe('displayServerList', () => {
    it('should display message when no servers configured', () => {
      displayServerList([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No MCP servers configured')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configure MCP servers in ~/.claude.json')
      );
    });

    it('should display enabled servers', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: true, source: 'none' },
        { name: 'linear', enabled: true, source: 'none' },
      ];

      displayServerList(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ Enabled Servers:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('github')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('linear')
      );
    });

    it('should display disabled servers with source', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: false, source: 'local' },
        { name: 'linear', enabled: false, source: 'global' },
      ];

      displayServerList(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗ Disabled Servers:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('github')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('(local)')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('linear')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('(global)')
      );
    });

    it('should display both enabled and disabled servers', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: true, source: 'none' },
        { name: 'linear', enabled: false, source: 'local' },
        { name: 'notion', enabled: true, source: 'none' },
      ];

      displayServerList(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ Enabled Servers:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗ Disabled Servers:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('2 enabled, 1 disabled')
      );
    });

    it('should display count summary', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: true, source: 'none' },
        { name: 'linear', enabled: false, source: 'local' },
        { name: 'notion', enabled: false, source: 'global' },
      ];

      displayServerList(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 enabled, 2 disabled')
      );
    });
  });

  describe('displayDetailedStatus', () => {
    it('should display message when no servers configured', () => {
      displayDetailedStatus([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No MCP servers configured')
      );
    });

    it('should display detailed status for enabled servers', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: true, source: 'none' },
      ];

      displayDetailedStatus(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('MCP Server Status:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('github')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Status:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Enabled')
      );
    });

    it('should display detailed status for disabled servers with source', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: false, source: 'local' },
        { name: 'linear', enabled: false, source: 'global' },
      ];

      displayDetailedStatus(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('github')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Disabled')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('(local config)')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('linear')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('(global config)')
      );
    });

    it('should display separator lines', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: true, source: 'none' },
      ];

      displayDetailedStatus(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('─'.repeat(60))
      );
    });

    it('should display summary with counts', () => {
      const statuses: ServerStatus[] = [
        { name: 'github', enabled: true, source: 'none' },
        { name: 'linear', enabled: false, source: 'local' },
        { name: 'notion', enabled: true, source: 'none' },
      ];

      displayDetailedStatus(statuses);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Total: 3 servers (2 enabled, 1 disabled)')
      );
    });
  });

  describe('displaySuccess', () => {
    it('should display success message with checkmark', () => {
      displaySuccess('Operation completed');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation completed')
      );
    });

    it('should use green color', () => {
      displaySuccess('Success');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('\x1b[32m'); // Green color code
    });
  });

  describe('displayError', () => {
    it('should display error message with X mark', () => {
      displayError('Operation failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed')
      );
    });

    it('should use red color', () => {
      displayError('Error');

      const call = consoleErrorSpy.mock.calls[0][0];
      expect(call).toContain('\x1b[31m'); // Red color code
    });
  });

  describe('displayWarning', () => {
    it('should display warning message with warning symbol', () => {
      displayWarning('Be careful');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Be careful')
      );
    });

    it('should use yellow color', () => {
      displayWarning('Warning');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('\x1b[33m'); // Yellow color code
    });
  });

  describe('displayInfo', () => {
    it('should display info message', () => {
      displayInfo('Information message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Information message')
      );
    });

    it('should use blue color', () => {
      displayInfo('Info');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('\x1b[34m'); // Blue color code
    });
  });
});
