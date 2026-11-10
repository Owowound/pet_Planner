using Analytics.Domain;

namespace Analytics.Application.Snapshots;

public class SnapshotNode
{
    public TaskFrame Frame { get; }
    public bool IsDeleted { get; }

    public SnapshotNode? Parent { get; internal set; }
    public List<SnapshotNode> Children { get; } = new();

    public double TreePercent { get; internal set; }

    public double OwnPercent => SnapshotBuilder.Percent(Frame.Progress, Frame.Goal);

    public bool IsCompleted => TreePercent >= 100;
    public bool IsRoot => Parent is null;

    public SnapshotNode(TaskFrame frame, bool isDeleted)
    {
        Frame = frame;
        IsDeleted = isDeleted;
    }
}