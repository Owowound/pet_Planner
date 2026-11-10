using Analytics.Domain;
using Microsoft.EntityFrameworkCore;

namespace Analytics.Infrastructure.DB;

public class AnalyticsRepository
{
    private readonly AppDbContext _context;

    public AnalyticsRepository(AppDbContext context)
    {
        _context = context;
    }

    public void AddTaskFrame(TaskFrame taskFrame)
    {
        _context.TaskFrames.Add(taskFrame);
    }

    public void AddDeleteFrame(DeleteFrame deleteFrame)
    {
        _context.DeleteFrames.Add(deleteFrame);
    }

    public async Task<bool> FrameExistsAsync(Guid taskId, DateTime frameTime, CancellationToken cancellationToken)
    {
        return await _context.TaskFrames
            .AnyAsync(f => f.Id == taskId && f.FrameTime == frameTime, cancellationToken);
    }

    public async Task<bool> DeleteFrameExistsAsync(Guid taskId, CancellationToken cancellationToken)
    {
        return await _context.DeleteFrames
            .AnyAsync(d => d.TaskId == taskId, cancellationToken);
    }

    public async Task<bool> IsTaskExistsAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _context.TaskFrames
            .AnyAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<List<TaskFrame>> GetTaskFramesBeforeDate(DateTime date, CancellationToken cancellationToken)
    {
        var maxTimes = _context.TaskFrames
            .Where(t => t.FrameTime < date)
            .GroupBy(t => t.Id)
            .Select(g => new { TaskId = g.Key, MaxTime = g.Max(t => t.FrameTime) });

        var result = await _context.TaskFrames
            .Where(t => t.FrameTime < date)
            .Join(maxTimes,
                t => new { t.Id, t.FrameTime },
                m => new { Id = m.TaskId, FrameTime = m.MaxTime },
                (t, _) => t)
            .ToListAsync(cancellationToken);

        return result;
    }

    public async Task<List<Guid>> GetDeletedIdsBeforeDate(DateTime date, CancellationToken cancellationToken)
    {
        return await _context.DeleteFrames
            .Where(d => d.FrameTime < date)
            .Select(d => d.TaskId)
            .ToListAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
