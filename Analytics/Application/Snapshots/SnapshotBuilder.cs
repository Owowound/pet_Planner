using Analytics.Domain;

namespace Analytics.Application.Snapshots;

public static class SnapshotBuilder
{
    public static Dictionary<Guid, SnapshotNode> Build(List<TaskFrame> frames, HashSet<Guid> deletedIds)
    {
        var nodes = new Dictionary<Guid, SnapshotNode>();
        foreach (var frame in frames)
        {
            if (deletedIds.Contains(frame.Id))
            {
                continue;
            }

            if (nodes.TryGetValue(frame.Id, out var existing) && existing.Frame.FrameTime >= frame.FrameTime)
            {
                continue;
            }

            nodes[frame.Id] = new SnapshotNode(frame, false);
        }

        foreach (var node in nodes.Values)
        {
            if (node.Frame.ParentId is not { } parentId)
            {
                continue;
            }

            if (nodes.TryGetValue(parentId, out var parent))
            {
                node.Parent = parent;
                parent.Children.Add(node);
            }
        }

        foreach (var root in nodes.Values.Where(n => n.IsRoot))
        {
            ComputePercent(root);
        }

        return nodes;
    }

    public static double Percent(int progress, int goal) =>
        goal <= 0 ? 0 : Math.Clamp(progress * 100.0 / goal, 0, 100);

    private static double ComputePercent(SnapshotNode node)
    {
        if (node.Children.Count == 0)
        {
            node.TreePercent = node.OwnPercent;
            return node.TreePercent;
        }

        double sum = 0;
        foreach (var child in node.Children)
        {
            sum += ComputePercent(child);
        }

        node.TreePercent = (sum / node.Children.Count + node.OwnPercent) / 2;
        return node.TreePercent;
    }
}
