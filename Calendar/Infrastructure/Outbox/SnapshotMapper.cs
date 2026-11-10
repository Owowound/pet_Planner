using System.Linq;
using Calendar.Domain;
using Contracts;

namespace Calendar.Infrastructure.Outbox;

public static class SnapshotMapper
{
    public static TaskUpserted ToSnapshot(TaskItem t) => new TaskUpserted(
        TaskId:      t.Id,
        ParentId:    t.ParentId,
        Name:        t.Name,
        Description: t.Description,
        Color:       t.Color,
        Deadline:    t.Deadline,
        Goal:        t.Goal,
        Progress:    t.Progress,
        IsCompleted: t.IsCompleted,
        TagIds:      t.Tags.Select(x => x.TagId).ToList(),
        CreatedAt:   t.CreatedAt,
        UpdatedAt:   t.UpdatedAt
        );
}