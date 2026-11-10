using Analytics.Infrastructure.DB;

namespace Analytics.Application.Snapshots;

public class SnapshotReader
{
    private readonly AnalyticsRepository _analyticsRepository;

    public SnapshotReader(AnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task<Dictionary<Guid, SnapshotNode>> BuildAt(DateTime at, CancellationToken cancellationToken)
    {
        var frames = await _analyticsRepository.GetTaskFramesBeforeDate(at, cancellationToken);
        var deleted = await _analyticsRepository.GetDeletedIdsBeforeDate(at, cancellationToken);
        
        return SnapshotBuilder.Build(frames, deleted.ToHashSet());
    }

    public async Task<Dictionary<Guid, SnapshotNode>> BuildAtOrEmpty(DateTime? at, CancellationToken cancellationToken)
    {
        if (at is null)
        {
            return new Dictionary<Guid, SnapshotNode>();
        }

        return await BuildAt(at.Value, cancellationToken);
    }
}
