using Analytics.Application.Dto;
using Analytics.Application.EndpointHandlers.Commands;
using Analytics.Application.Periods;
using Analytics.Application.Snapshots;

namespace Analytics.Application.EndpointHandlers;

public class GeneralStatsHandler
{
    private readonly SnapshotReader _snapshotReader;

    public GeneralStatsHandler(SnapshotReader snapshotReader)
    {
        _snapshotReader = snapshotReader;
    }

    public async Task<GeneralDto> Handle(GetGeneralStatsCommand cmd, CancellationToken cancellationToken)
    {
        var period = Period.Create(cmd.From, cmd.To);

        var end = await _snapshotReader.BuildAt(period.To, cancellationToken);
        var start = await _snapshotReader.BuildAtOrEmpty(period.From, cancellationToken);

        var completed = end.Values.Count(n =>
            n.IsCompleted && !(start.TryGetValue(n.Frame.Id, out var s) && s.IsCompleted));

        return new GeneralDto(
            Completed: completed,
            PercentComplete: AverageRootPercent(end),
            StartPercentComplete: period.IsAllTime ? null : AverageRootPercent(start));
    }

    private static double? AverageRootPercent(Dictionary<Guid, SnapshotNode> snapshot)
    {
        var roots = snapshot.Values.Where(n => n.IsRoot).ToList();
        
        if (roots.Count == 0)
        {
            return null;
        }

        return roots.Average(n => n.TreePercent);
    }
}
