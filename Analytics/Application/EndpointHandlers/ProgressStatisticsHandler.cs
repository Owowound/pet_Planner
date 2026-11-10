using Analytics.Application.Dto;
using Analytics.Application.EndpointHandlers.Commands;
using Analytics.Application.Periods;
using Analytics.Application.Snapshots;

namespace Analytics.Application.EndpointHandlers;

public class ProgressStatisticsHandler
{
    private readonly SnapshotReader _snapshotReader;

    public ProgressStatisticsHandler(SnapshotReader snapshotReader)
    {
        _snapshotReader = snapshotReader;
    }

    public async Task<List<TaskNodeDto>> Handle(GetProgressStatisticsCommand cmd, CancellationToken cancellationToken)
    {
        var period = Period.Create(cmd.From, cmd.To);

        var end = await _snapshotReader.BuildAt(period.To, cancellationToken);
        var start = await _snapshotReader.BuildAtOrEmpty(period.From, cancellationToken);

        return end.Values
            .Where(n => n.IsRoot)
            .OrderBy(n => n.Frame.Deadline)
            .Select(n => TaskNodeMapper.SnapshotToNode(n, start))
            .ToList();
    }
}
