import { disableCommand } from './disable';
import * as reader from '../config/reader';
import * as writer from '../config/writer';
import * as display from '../utils/display';

jest.mock('../config/reader');
jest.mock('../config/writer');
jest.mock('../utils/display');

describe('disable command', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should display error when no server names provided', () => {
    disableCommand([]);

    expect(display.displayError).toHaveBeenCalledWith(
      'Please specify at least one server name to disable.'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Usage: claude-mcp-helper disable')
    );
  });

  it('should display error when server is not configured', () => {
    jest
      .spyOn(reader, 'getAvailableServers')
      .mockReturnValue(['github', 'linear']);

    disableCommand(['nonexistent']);

    expect(display.displayError).toHaveBeenCalledWith(
      'Server "nonexistent" is not configured.'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Available servers: github, linear')
    );
  });

  it('should display warning when server is already disabled', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: false,
      source: 'local',
    });

    disableCommand(['github']);

    expect(display.displayWarning).toHaveBeenCalledWith(
      'Server "github" is already disabled.'
    );
    expect(writer.disableServer).not.toHaveBeenCalled();
  });

  it('should disable an enabled server successfully', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: true,
      source: 'none',
    });
    jest.spyOn(writer, 'disableServer').mockImplementation();

    disableCommand(['github']);

    expect(writer.disableServer).toHaveBeenCalledWith('github');
    expect(display.displaySuccess).toHaveBeenCalledWith(
      'Disabled server "github".'
    );
  });

  it('should disable multiple servers', () => {
    jest
      .spyOn(reader, 'getAvailableServers')
      .mockReturnValue(['github', 'linear', 'notion']);
    jest
      .spyOn(reader, 'getServerStatus')
      .mockImplementation((name: string) => ({
        name,
        enabled: true,
        source: 'none',
      }));
    jest.spyOn(writer, 'disableServer').mockImplementation();

    disableCommand(['github', 'linear']);

    expect(writer.disableServer).toHaveBeenCalledWith('github');
    expect(writer.disableServer).toHaveBeenCalledWith('linear');
    expect(display.displaySuccess).toHaveBeenCalledTimes(2);
  });

  it('should handle errors when disabling a server', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: true,
      source: 'none',
    });
    jest.spyOn(writer, 'disableServer').mockImplementation(() => {
      throw new Error('Write failed');
    });

    disableCommand(['github']);

    expect(display.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to disable "github"')
    );
  });

  it('should continue disabling other servers if one fails', () => {
    jest
      .spyOn(reader, 'getAvailableServers')
      .mockReturnValue(['github', 'linear']);
    jest
      .spyOn(reader, 'getServerStatus')
      .mockImplementation((name: string) => ({
        name,
        enabled: true,
        source: 'none',
      }));
    jest
      .spyOn(writer, 'disableServer')
      .mockImplementationOnce(() => {
        throw new Error('Write failed');
      })
      .mockImplementationOnce(() => {
        // Second call succeeds
      });

    disableCommand(['github', 'linear']);

    expect(writer.disableServer).toHaveBeenCalledWith('github');
    expect(writer.disableServer).toHaveBeenCalledWith('linear');
    expect(display.displayError).toHaveBeenCalledTimes(1);
    expect(display.displaySuccess).toHaveBeenCalledTimes(1);
  });

  it('should skip non-configured servers and continue with others', () => {
    jest.spyOn(reader, 'getAvailableServers').mockReturnValue(['github']);
    jest.spyOn(reader, 'getServerStatus').mockReturnValue({
      name: 'github',
      enabled: true,
      source: 'none',
    });
    jest.spyOn(writer, 'disableServer').mockImplementation();

    disableCommand(['nonexistent', 'github']);

    expect(display.displayError).toHaveBeenCalledWith(
      'Server "nonexistent" is not configured.'
    );
    expect(writer.disableServer).toHaveBeenCalledWith('github');
    expect(display.displaySuccess).toHaveBeenCalledWith(
      'Disabled server "github".'
    );
  });
});
