import { describe, it, vi, expect } from 'vitest';
import { getFinancialYearSummary, getFinancialSummaryByMonth } from './financialDb';
import * as dbModule from './db';

vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Performance of getFinancialYearSummary', () => {
  it('benchmarks getFinancialYearSummary', async () => {
    // mock DB response
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (dbModule.getDb as any).mockResolvedValue(mockDb);

    let dbCallCount = 0;
    mockDb.where.mockImplementation(() => {
      dbCallCount++;
      return Promise.resolve([
        {
          weekNumber: 1,
          year: 2023,
          departureDate: '2023-01-01',
          returnDate: '2023-01-08',
          isDeleted: 0,
          isTicketIssued: 1,
          price: "1000",
          airline: "LATAM"
        }
      ]);
    });

    const start = performance.now();
    for(let i=0; i<100; i++) {
      await getFinancialYearSummary(2023);
    }
    const end = performance.now();

    console.log(`[Benchmark] Time taken: ${end - start} ms, DB calls: ${dbCallCount}`);
  });
});
