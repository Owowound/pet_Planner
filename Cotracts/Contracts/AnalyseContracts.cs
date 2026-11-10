using System.Text.Json.Serialization;

namespace Contracts;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "$type")]
[JsonDerivedType(typeof(TaskUpserted), "task-upserted")]
[JsonDerivedType(typeof(TaskDeleted), "task-deleted")]
public abstract record IntegrationEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}

public record TaskUpserted(
    Guid TaskId, 
    Guid? ParentId, 
    string Name, 
    string Description,
    string Color, 
    DateTime Deadline, 
    int Goal, 
    int Progress,
    bool IsCompleted,
    List<Guid> TagIds,
    DateTime CreatedAt, 
    DateTime UpdatedAt) 
    : IntegrationEvent;

public record TaskDeleted(List<Guid> TaskIds, DateTime DeletedAt) : IntegrationEvent;
