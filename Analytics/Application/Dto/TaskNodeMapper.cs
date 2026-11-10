using Analytics.Application.Snapshots;

namespace Analytics.Application.Dto;

public static class TaskNodeMapper
{
    public static TaskNodeDto SnapshotToNode(SnapshotNode node, Dictionary<Guid, SnapshotNode> start)
    {
        var f = node.Frame;

        return new TaskNodeDto(
            TaskId:           f.Id,
            Name:             f.Name,
            Color:            f.Color,
            TagIds:           f.Tags,
            Progress:         f.Progress,
            Goal:             f.Goal,
            OwnPercent:       node.OwnPercent,
            TreePercent:      node.TreePercent,
            StartTreePercent: start.TryGetValue(f.Id, out var s) ? s.TreePercent : null,
            IsCompleted:      node.IsCompleted,
            Children:         node.Children
                .OrderBy(c => c.Frame.Deadline)
                .Select(c => SnapshotToNode(c, start))
                .ToList());
    }
}
