using Contracts;

namespace Analytics.Domain;

public class TaskFrame
{
    public DateTime FrameTime { get; private set; }
    public FrameState State { get; private set; }
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public string Color { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime Deadline { get; private set; }
    public int Goal { get; private set; }
    public int Progress { get; private set; }
    public bool IsCompleted { get; private set; }

    public Guid? ParentId { get; private set; }

    public List<Guid> Tags { get; private set; } = new();

    public double ProgressPercent => Goal <= 0 ? 0 : Math.Clamp(Progress * 100.0 / Goal, 0, 100);

    private TaskFrame()
    {
    }

    public TaskFrame(TaskUpserted upserted, FrameState state)
    {
        ArgumentNullException.ThrowIfNull(upserted);

        FrameTime = upserted.UpdatedAt;

        Id = upserted.TaskId;
        Name = upserted.Name ?? string.Empty;
        Description = upserted.Description ?? string.Empty;
        Color = upserted.Color ?? string.Empty;

        CreatedAt = upserted.CreatedAt;
        UpdatedAt = upserted.UpdatedAt;
        Deadline = upserted.Deadline;
        Goal = upserted.Goal;
        Progress = upserted.Progress;
        IsCompleted = upserted.IsCompleted;
        ParentId = upserted.ParentId;

        Tags = upserted.TagIds?.ToList() ?? new List<Guid>();

        State = state;
    }
}
