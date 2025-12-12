import { enableCommand } from './enable';
import * as reader from '../config/reader';
import * as writer from '../config/writer';
import * as display from '../utils/display';

jest.mock('../config/reader');
jest.mock('../config/writer');
jest.mock('../utils/display');

describe('enable command', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should display error when no server names provided', () => {
    enableCommand([]);

    expect(display.displayError).toHaveBeenCalledWith(
      'Please specify at least one server name to enable.'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Usage: claude-mcp-helper enable')
    );
  });

  it('should display error when server is not configured', () => {
    jest
      .spyOn(reader, 'getAvailableServers')
      .mockReturnValue(['github', 'linear']);

    enableCommand(['nonexistent']);

    expect(display.displayError).toHaveBeenCalledWith(
      'Server "nonexistent" is not configured.'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Available servers: github, linear')
    );
  });

  it('should display warning when server is already enabled', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: true,
      source: 'none',
    });

    enableCommand(['github']);

    expect(display.displayWarning).toHaveBeenCalledWith(
      'Server "github" is already enabled.'
    );
    expect(writer.enableServer).not.toHaveBeenCalled();
  });

  it('should enable a disabled server successfully', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: false,
      source: 'local',
    });
    jest.spyOn(writer, 'enableServer').mockImplementation();

    enableCommand(['github']);

    expect(writer.enableServer).toHaveBeenCalledWith('github');
    expect(display.displaySuccess).toHaveBeenCalledWith(
      'Enabled server "github".'
    );
  });

  it('should enable multiple servers', () => {
    jest
      .spyOn(reader, 'getAvailableServers')
      .mockReturnValue(['github', 'linear', 'notion']);
    jest
      .spyOn(reader, 'getServerStatus')
      .mockImplementation((name: string) => ({
        name,
        enabled: false,
        source: 'local',
      }));
    jest.spyOn(writer, 'enableServer').mockImplementation();

    enableCommand(['github', 'linear']);

    expect(writer.enableServer).toHaveBeenCalledWith('github');
    expect(writer.enableServer).toHaveBeenCalledWith('linear');
    expect(display.displaySuccess).toHaveBeenCalledTimes(2);
  });

  it('should handle errors when enabling a server', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: false,
      source: 'local',
    });
    jest.spyOn(writer, 'enableServer').mockImplementation(() => {
      throw new Error('Write failed');
    });

    enableCommand(['github']);

    expect(display.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to enable "github"')
    );
  });

  it('should continue enabling other servers if one fails', () => {
    jest
      .spyOn(reader, 'getAvailableServers')
      .mockReturnValue(['github', 'linear']);
    jest
      .spyOn(reader, 'getServerStatus')
      .mockImplementation((name: string) => ({
        name,
        enabled: false,
        source: 'local',
      }));
    jest
      .spyOn(writer, 'enableServer')
      .mockImplementationOnce(() => {
        throw new Error('Write failed');
      })
      .mockImplementationOnce(() => {
        // Second call succeeds
      });

    enableCommand(['github', 'linear']);

    expect(writer.enableServer).toHaveBeenCalledWith('github');
    expect(writer.enableServer).toHaveBeenCalledWith('linear');
    expect(display.displayError).toHaveBeenCalledTimes(1);
    expect(display.displaySuccess).toHaveBeenCalledTimes(1);
  });

  it('should skip non-configured servers and continue with others', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: false,
      source: 'local',
    });
    jest.spyOn(writer, 'enableServer').mockImplementation();

    enableCommand(['nonexistent', 'github']);

    expect(display.displayError).toHaveBeenCalledWith(
      'Server "nonexistent" is not configured.'
    );
    expect(writer.enableServer).toHaveBeenCalledWith('github');
    expect(display.displaySuccess).toHaveBeenCalledWith(
      'Enabled server "github".'
    );
  });
});
