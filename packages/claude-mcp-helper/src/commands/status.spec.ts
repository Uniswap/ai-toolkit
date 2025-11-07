import { statusCommand } from './status';
import * as reader from '../config/reader';
import * as display from '../utils/display';

jest.mock('../config/reader');
jest.mock('../utils/display');

describe('status command', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should display warning when no MCP servers are configured', () => {
    jest.spyOn(reader, 'hasMcpServers').mockReturnValue(false);

    statusCommand();

    expect(display.displayWarning).toHaveBeenCalledWith(
      'No MCP servers configured.'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('To configure MCP servers')
    );
  });

  it('should display detailed status when servers are configured', () => {
    const mockStatuses = [
      { name: 'github', enabled: true, source: 'none' as const },
      { name: 'linear', enabled: false, source: 'local' as const },
      { name: 'notion', enabled: true, source: 'none' as const },
    ];

    jest.spyOn(reader, 'hasMcpServers').mockReturnValue(true);
    jest.spyOn(reader, 'getAllServerStatuses').mockReturnValue(mockStatuses);

    statusCommand();

    expect(reader.getAllServerStatuses).toHaveBeenCalled();
    expect(display.displayDetailedStatus).toHaveBeenCalledWith(mockStatuses);
  });

  it('should display configuration example when no servers configured', () => {
    jest.spyOn(reader, 'hasMcpServers').mockReturnValue(false);

    statusCommand();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('mcpServers')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('server-name')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('npx'));
  });
});
