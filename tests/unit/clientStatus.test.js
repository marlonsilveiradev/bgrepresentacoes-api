const { calculateOverallStatus } = require('../../src/shared/utils/clientStatus');

describe('calculateOverallStatus', () => {
  it('retorna "pending" quando não há bandeiras', () => {
    expect(calculateOverallStatus([])).toBe('pending');
    expect(calculateOverallStatus(null)).toBe('pending');
    expect(calculateOverallStatus(undefined)).toBe('pending');
  });

  it('retorna "approved" quando TODAS as bandeiras estão aprovadas', () => {
    const flags = [
      { status: 'approved' },
      { status: 'approved' },
      { status: 'approved' },
    ];
    expect(calculateOverallStatus(flags)).toBe('approved');
  });

  it('retorna "analysis" quando há pelo menos uma em análise', () => {
    const flags = [
      { status: 'approved' },
      { status: 'analysis' },
      { status: 'pending' },
    ];
    expect(calculateOverallStatus(flags)).toBe('analysis');
  });

  it('retorna "pending" quando todas estão pendentes', () => {
    const flags = [
      { status: 'pending' },
      { status: 'pending' },
    ];
    expect(calculateOverallStatus(flags)).toBe('pending');
  });

  it('retorna "analysis" quando algumas estão aprovadas mas não todas', () => {
    const flags = [
      { status: 'approved' },
      { status: 'pending' },
    ];
    expect(calculateOverallStatus(flags)).toBe('analysis');
  });
});